# Boss Rummy - Project Recovery & Deployment Dossier

This document provides a comprehensive history of the technical challenges encountered and resolved during the deployment of the Boss Rummy application, transitioning from Render to Vercel.

---

## 📅 Part 1: The Render Phase (Struggles & Diagnostics)

### 1. The "Non-Stop" ERR_NAME_NOT_RESOLVED Error
- **Problem:** The `LoginForm` was stuck in an infinite loop of requests, causing "Network Error" alerts and console spam.
- **Cause:** A hardcoded placeholder image URL (`https://placeholder.com/...`) was failing to resolve, triggering the `useEffect` hooks repeatedly.
- **Fix:** Replaced the broken URL with a stable Unsplash image and optimized the `useEffect` dependency arrays in `LoginForm.tsx`.

### 2. The Render SMTP Block (Connection Timeouts)
- **Problem:** Gmail and Hostinger SMTP both worked locally but failed with `Connection Timeout` on Render.
- **Discovery:** Render's infrastructure strictly blocks outbound traffic on ports 465 and 587 for many projects.
- **Attempted Fixes:** 
  - Forced IPv4 (`family: 4`).
  - Added aggressive `connectionTimeout` and `socketTimeout` (15s).
  - Used `rejectUnauthorized: false` for TLS stability.
- **Outcome:** Render's network block was insurmountable for standard SMTP, prompting a move to a working pattern.

---

## 🧪 Part 2: The "Magic" Solution (Gmail Service Pattern)

### 3. Replicating the Working Implementation
- **Analysis:** Analyzed a second project provided by the user where Gmail SMTP was working on Render.
- **The Secret:** The working project used Nodemailer's built-in `service: 'gmail'` shortcut rather than manual host/port configuration.
- **Implementation:** 
  - Refactored `server.js` to create transporters **on-demand** inside request handlers (better for serverless/lambdas).
  - Switched to the minimal `service: 'gmail'` configuration.
  - Added a plain-text fallback to the HTML emails to ensure deliverability.

---

## 🚀 Part 3: The Vercel Migration (Final Success)

### 4. Vercel Configuration & Routing
- **Problem:** Vercel was initially showing a **White Screen/Blank Page**.
- **Cause:** The single-page application (SPA) routing was intercepting requests for CSS/JS files and returning the HTML content instead.
- **Fix:** Created `vercel.json` with the `"handle": "filesystem"` directive. This ensures Vercel serves the real files first before falling back to `index.html`.

### 5. Serverless Refactoring (Safe Start)
- **Problem:** The Vercel function was crashing with `FUNCTION_INVOCATION_FAILED`.
- **Cause:** `process.exit(1)` was being called if the database was slow to connect, killing the entire process.
- **Fix:** 
  - Removed all `process.exit` calls.
  - Wrapped database logic in a `connectToDatabase` function that won't crash the server if it fails.
  - Implemented the `ensureDb` helper: Every API request now checks for a DB connection and **waits up to 5 seconds** for it to become ready before processing.

### 6. The MongoDB IP Whitelist
- **Problem:** Database remained "disconnected" even with the correct URI.
- **Fix:** User whitelisted `0.0.0.0/0` in MongoDB Atlas to allow Vercel's dynamic IP addresses to connect.

---

## 🛠️ Part 4: Maintenance & Future Steps

### 🗝️ Handling Credentials
If you need to change your email or password later:
1. Generate a new **Gmail App Password** (16 digits).
2. Go to **Vercel Settings -> Environment Variables**.
3. Update `SMTP_PASS`.
4. **Redeploy** the app for the changes to take effect.

### 🔗 Critical Links
- **Production URL:** `https://deploy-test-three-gold.vercel.app/`
- **System Diagnostics:** `https://deploy-test-three-gold.vercel.app/api/health`
  - Use this link any time the app feels "broken." If it says `db: connected` and `has_mongo: true`, the system is healthy.

### ✅ Final Software Stack
- **Frontend:** Vite / React
- **Backend:** Express (Serverless on Vercel)
- **Database:** MongoDB Atlas
- **Email:** Nodemailer (Gmail Service)
- **Hosting:** Vercel

**End of Dossier.**
