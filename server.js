import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { MongoClient, ServerApiVersion } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CONFIGURATION
 */
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

const cleanVar = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

const smtpHost = cleanVar(process.env.SMTP_HOST) || 'smtp.hostinger.com';
const smtpPort = cleanVar(process.env.SMTP_PORT) || '587';

const SMTP_CONFIG = {
  host: smtpHost,
  port: parseInt(smtpPort),
  secure: smtpPort === '465', // true for 465, false for 587
  auth: {
    user: cleanVar(process.env.SMTP_USER),
    pass: cleanVar(process.env.SMTP_PASS)
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4
};

if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("WARNING: SMTP credentials (USER/PASS) are missing from environment variables.");
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Maximize limits to 500MB to ensure no 413 errors even with high-res assets
const MAX_LIMIT = 500 * 1024 * 1024;
app.use(express.json({ limit: MAX_LIMIT }));
app.use(express.urlencoded({ limit: MAX_LIMIT, extended: true, parameterLimit: 1000000 }));

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));
const client = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db, usersCol, configCol;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("boss-rummy-vault");
    usersCol = db.collection("users");
    configCol = db.collection("config");

    await usersCol.createIndex({ email: 1 }, { unique: true });

    const hasWheelSettings = await configCol.findOne({ type: 'wheel_settings' });
    if (!hasWheelSettings) {
      await configCol.insertOne({
        type: 'wheel_settings',
        dailySpinLimit: 1,
        rewards: [
          { id: 0, label: '₹10 Bonus', type: 'balance', value: 10, weight: 40 },
          { id: 1, label: 'Try Again', type: 'none', value: 0, weight: 20 },
          { id: 2, label: '₹50 Bonus', type: 'balance', value: 50, weight: 15 },
          { id: 3, label: 'Voucher Pack', type: 'none', value: 0, weight: 10 },
          { id: 4, label: 'Better Luck', type: 'none', value: 0, weight: 10 },
          { id: 5, label: '₹500 MEGA', type: 'balance', value: 500, weight: 1, premium: true },
          { id: 6, label: 'Jackpot Entry', type: 'none', value: 0, weight: 2 },
          { id: 7, label: '₹100 Bonus', type: 'balance', value: 100, weight: 2 }
        ]
      });
    }

    const hasAnnouncement = await configCol.findOne({ type: 'announcement' });
    if (!hasAnnouncement) {
      await configCol.insertOne({
        type: 'announcement',
        enabled: true,
        imageUrl: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&q=80&w=1200'
      });
    }

    const adminEmail = 'admin@boss.com';
    const adminExists = await usersCol.findOne({ email: adminEmail });
    if (!adminExists) {
      await usersCol.insertOne({
        name: 'Vault Administrator',
        email: adminEmail,
        password: 'adminpassword',
        balance: 0,
        isAdmin: true
      });
    }

    console.log("Connected to MongoDB Cloud Sanctuary");
  } catch (err) {
    console.error("Database Connection Failed:", err);
  }
}

connectToDatabase();

const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Verification of SMTP Config on Startup
transporter.verify((error) => {
  if (error) {
    console.error("[SMTP] Connection Failed:", error.message);
  } else {
    console.log("[SMTP] Service is ready to deliver notifications");
  }
});
const pendingOtps = new Map();
const pendingEmailChanges = new Map();
const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;

// --- AUTH ENDPOINTS ---

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });

  const normalizedEmail = email.toLowerCase();
  const existingUser = await usersCol.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + (5 * 60 * 1000);
  pendingOtps.set(normalizedEmail, { otp, expires });

  try {
    await transporter.sendMail({
      from: `"Boss Rummy Support" <${SMTP_CONFIG.auth.user}>`,
      to: normalizedEmail,
      subject: "Boss Rummy - Your Verification Code",
      html: `<div style="padding:20px; background:#f4f4f4; border-radius:10px;"><h2>OTP: ${otp}</h2></div>`
    });
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error("SMTP Error Details:", error);
    console.log(`[FALLBACK] OTP for ${normalizedEmail}: ${otp}`);
    res.status(500).json({ error: 'Failed to send email. Check SMTP settings.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, email, password, otp } = req.body;
  const normalizedEmail = (email || '').toLowerCase();
  const storedData = pendingOtps.get(normalizedEmail);

  if (!storedData || storedData.otp !== otp || Date.now() > storedData.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }

  pendingOtps.delete(normalizedEmail);

  try {
    const newUser = {
      name,
      email: normalizedEmail,
      password,
      balance: 500,
      lastSpinTimestamp: 0,
      spinCount: 0,
      spinWindowStart: 0,
      isAdmin: false
    };
    await usersCol.insertOne(newUser);
    res.status(201).json({ user: { ...newUser, isLoggedIn: true } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed. User may already exist.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await usersCol.findOne({ email: (email || '').toLowerCase(), password });
  if (user) {
    res.json({ user: { ...user, isLoggedIn: true, password: undefined } });
  } else {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
});

app.get('/api/profile/:email', async (req, res) => {
  const user = await usersCol.findOne({ email: req.params.email.toLowerCase() });
  if (user) {
    res.json({ ...user, password: undefined });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// --- ACCOUNT SECURITY ENDPOINTS ---

app.post('/api/initiate-email-change', async (req, res) => {
  const { currentEmail, newEmail } = req.body;
  if (!newEmail || !currentEmail) return res.status(400).json({ error: 'Emails required.' });

  const normalizedNew = newEmail.toLowerCase();
  const normalizedCurrent = currentEmail.toLowerCase();

  if (normalizedNew === normalizedCurrent) {
    return res.status(400).json({ error: 'New email must be different.' });
  }

  const existingUser = await usersCol.findOne({ email: normalizedNew });
  if (existingUser) {
    return res.status(400).json({ error: 'Email already in use by another player.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + (10 * 60 * 1000);
  pendingEmailChanges.set(normalizedCurrent, { newEmail: normalizedNew, otp, expires });

  try {
    await transporter.sendMail({
      from: `"Boss Rummy Security" <${SMTP_CONFIG.auth.user}>`,
      to: normalizedNew,
      subject: "Boss Rummy - Email Verification Code",
      html: `
        <div style="padding:40px; background:#00241d; color:white; border-radius:20px; text-align:center; font-family:sans-serif;">
          <h2 style="color:#fbbf24; text-transform:uppercase; letter-spacing:2px;">Verification Protocol</h2>
          <p style="opacity:0.8;">Enter the following code to verify your new identity:</p>
          <div style="background:#001a15; padding:20px; border-radius:15px; font-size:32px; font-weight:900; color:#fbbf24; margin:30px 0; border:1px solid rgba(251,191,36,0.2);">
            ${otp}
          </div>
          <p style="font-size:12px; opacity:0.5;">This code expires in 10 minutes.</p>
        </div>
      `
    });
    res.json({ success: true, message: 'Verification code sent to new email.' });
  } catch (error) {
    console.log(`[FALLBACK] Email Change OTP for ${normalizedNew}: ${otp}`);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

app.post('/api/verify-email-change', async (req, res) => {
  const { currentEmail, otp } = req.body;
  const normalizedCurrent = (currentEmail || '').toLowerCase();
  const changeData = pendingEmailChanges.get(normalizedCurrent);

  if (!changeData || changeData.otp !== otp || Date.now() > changeData.expires) {
    return res.status(400).json({ error: 'Invalid or expired verification code.' });
  }

  try {
    const { newEmail } = changeData;
    const result = await usersCol.updateOne(
      { email: normalizedCurrent },
      { $set: { email: newEmail } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Current player identity not found.' });
    }

    pendingEmailChanges.delete(normalizedCurrent);

    const updatedUser = await usersCol.findOne({ email: newEmail });
    res.json({ success: true, user: { ...updatedUser, password: undefined } });
  } catch (err) {
    res.status(500).json({ error: 'Identity update failed. Email might have been claimed recently.' });
  }
});

// --- ANNOUNCEMENT ENDPOINTS ---

app.get('/api/announcement', async (req, res) => {
  try {
    const config = await configCol.findOne({ type: 'announcement' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcement" });
  }
});

app.post('/api/admin/update-announcement', async (req, res) => {
  const payloadSizeKb = (JSON.stringify(req.body).length / 1024).toFixed(2);
  console.log(`[ADMIN] Incoming Broadcast Request. Size: ${payloadSizeKb} KB`);

  try {
    const { enabled, imageUrl } = req.body;

    if (!imageUrl) {
      console.warn("[ADMIN] Broadcast Rejected: Image data is empty.");
      return res.status(400).json({ error: "Image content is required. Please upload or paste a valid source." });
    }

    // Perform update with explicit feedback
    const result = await configCol.updateOne(
      { type: 'announcement' },
      {
        $set: {
          enabled: !!enabled,
          imageUrl,
          lastUpdated: Date.now()
        }
      },
      { upsert: true }
    );

    console.log(`[ADMIN] Broadcast Applied. Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}`);
    return res.json({
      success: true,
      message: "Broadcast protocol updated successfully.",
      details: { size: `${payloadSizeKb}KB` }
    });
  } catch (err) {
    console.error("[ADMIN] Critical Announcement Update Error:", err);
    return res.status(500).json({ error: `Storage protocol failed: ${err.message}` });
  }
});

// --- WHEEL ENDPOINTS ---

app.get('/api/wheel-config', async (req, res) => {
  const config = await configCol.findOne({ type: 'wheel_settings' });
  res.json({ rewards: config.rewards, settings: { dailySpinLimit: config.dailySpinLimit } });
});

app.post('/api/spin', async (req, req_res) => {
  const { email } = req.body;
  const user = await usersCol.findOne({ email: (email || '').toLowerCase() });
  if (!user) return req_res.status(404).json({ error: 'User not found.' });

  const config = await configCol.findOne({ type: 'wheel_settings' });
  const now = Date.now();

  let { spinCount, spinWindowStart, balance } = user;

  if (!spinWindowStart || (now - spinWindowStart > SPIN_COOLDOWN)) {
    spinCount = 0;
    spinWindowStart = now;
  }

  if (spinCount >= config.dailySpinLimit) {
    return req_res.status(403).json({ error: 'Daily limit reached.' });
  }

  const totalWeight = config.rewards.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedReward = config.rewards[0];

  for (const reward of config.rewards) {
    if (random < reward.weight) {
      selectedReward = reward;
      break;
    }
    random -= reward.weight;
  }

  const updatedBalance = selectedReward.type === 'balance' ? balance + selectedReward.value : balance;
  const updatedSpinCount = spinCount + 1;

  await usersCol.updateOne(
    { email: user.email },
    { $set: { balance: updatedBalance, spinCount: updatedSpinCount, spinWindowStart, lastSpinTimestamp: now } }
  );

  req_res.json({
    reward: selectedReward,
    newBalance: updatedBalance,
    lastSpinTimestamp: now,
    spinCount: updatedSpinCount,
    spinWindowStart
  });
});

// --- ADMIN ENDPOINTS ---

app.get('/api/admin/users', async (req, res) => {
  const players = await usersCol.find({ isAdmin: { $ne: true } }).toArray();
  res.json(players.map(u => ({ ...u, password: undefined })));
});

app.post('/api/admin/update-balance', async (req, res) => {
  const { email, newBalance } = req.body;
  const result = await usersCol.updateOne({ email }, { $set: { balance: parseFloat(newBalance) } });
  if (result.matchedCount) {
    res.json({ success: true, balance: parseFloat(newBalance) });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/admin/rewards', async (req, res) => {
  const config = await configCol.findOne({ type: 'wheel_settings' });
  res.json({ rewards: config.rewards, settings: { dailySpinLimit: config.dailySpinLimit } });
});

app.post('/api/admin/update-rewards', async (req, res) => {
  const { updatedRewards, dailySpinLimit } = req.body;
  const updateData = {};
  if (Array.isArray(updatedRewards)) updateData.rewards = updatedRewards;
  if (typeof dailySpinLimit === 'number') updateData.dailySpinLimit = dailySpinLimit;

  await configCol.updateOne({ type: 'wheel_settings' }, { $set: updateData });
  res.json({ success: true });
});

// --- CATCH-ALL ROUTE FOR SPA ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Backend Sanctuary Online with MongoDB at http://localhost:${PORT}`));
