import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, Lock, User as UserIcon, Mail, Zap, Trophy, ArrowRight, ShieldAlert, Clock } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : '';

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerifying(true);
        setTimer(60);
      } else {
        throw new Error(data.error || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Record precise login time
        onLogin({ ...data.user, loginTimestamp: Date.now() });
      } else {
        throw new Error(data.error || 'Identity verification failed.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Record precise login time
        onLogin({ ...data.user, loginTimestamp: Date.now() });
      } else {
        throw new Error(data.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Switch to verify mode only during registration
  const mainSubmit = isLogin ? handleLogin : handleSendOtp;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="glass-card w-full max-w-md p-0 rounded-[2.5rem] shadow-2xl border border-[#C4D9FF] overflow-hidden fade-in bg-white/80 backdrop-blur-xl">

        {/* Banner Section */}
        <div className="bg-[#E8F9FF] p-10 text-center border-b border-[#C4D9FF] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4D9FF] to-[#C5BAFF]"></div>
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#C5BAFF]/20 rounded-full blur-[80px]"></div>

          <img
            src={logoLoadError ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23E8F9FF'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-weight='bold' font-size='14' fill='%23C4D9FF' text-anchor='middle' dy='.3em'%3EBOSS%3C/text%3E%3C/svg%3E" : "/assets/logo.png"}
            alt="Boss Rummy Logo"
            className="h-20 w-auto mx-auto mb-6 drop-shadow-md"
            onError={() => setLogoLoadError(true)}
          />
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2 flex items-center justify-center gap-2">
            BOSS <span className="text-[#C5BAFF]">RUMMY</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
            {isVerifying ? 'Identity Verification' : isLogin ? 'Player Entry Portal' : 'Exclusive Membership'}
          </p>
        </div>

        <div className="p-10">
          {!isVerifying ? (
            <>
              {/* Toggle Switch */}
              {/* Toggle Switch */}
              <div className="flex mb-10 bg-[#FBFBFB] rounded-2xl p-1.5 border border-[#E8F9FF] relative">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(null); }}
                  className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 z-10 ${isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(null); }}
                  className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 z-10 ${!isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  New Player
                </button>
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#C5BAFF] rounded-xl transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isLogin ? 'left-1.5' : 'left-[calc(50%+3px)]'
                    } shadow-md`}
                />
              </div>

              <form onSubmit={mainSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="fade-in group">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1" htmlFor="name">
                      Display Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5BAFF] transition-colors" />
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-[#C4D9FF] rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:outline-none focus:border-[#C5BAFF] transition-all text-sm font-bold placeholder:text-slate-300"
                        placeholder="Boss Legend"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5BAFF] transition-colors" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-[#C4D9FF] rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:outline-none focus:border-[#C5BAFF] transition-all text-sm font-bold placeholder:text-slate-300"
                      placeholder="vault@bossrummy.com"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5BAFF] transition-colors" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-[#C4D9FF] rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:outline-none focus:border-[#C5BAFF] transition-all text-sm font-bold placeholder:text-slate-300"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-500 flex items-center gap-3 animate-pulse">
                    <ShieldAlert size={16} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[11px] transition-all shadow-lg group relative overflow-hidden ${isLoading ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-95'
                    } bg-[#C4D9FF] hover:bg-[#a3c2ff]`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                      <>Syncing Vault...</>
                    ) : (
                      <>
                        {isLogin ? <ShieldCheck size={18} /> : <Zap size={18} />}
                        {isLogin ? 'Enter Vault' : 'Initiate Verification'}
                      </>
                    )}
                  </span>
                </button>
              </form>
            </>
          ) : (
            /* OTP VERIFICATION VIEW */
            <div className="fade-in space-y-8 text-center">
              <div className="p-6 bg-[#E8F9FF] border border-[#C4D9FF] rounded-3xl mb-4">
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  We've sent a 6-digit access code to <br />
                  <span className="text-slate-900 font-black">{email}</span>
                </p>
              </div>

              <div className="flex justify-between gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-12 h-16 bg-white border border-[#C4D9FF] rounded-xl text-center text-2xl font-black text-slate-800 focus:border-[#C5BAFF] focus:outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-500 flex items-center gap-3">
                  <ShieldAlert size={16} /> {error}
                </div>
              )}

              <div className="space-y-4 pt-4">
                <button
                  onClick={handleVerifyAndRegister}
                  disabled={isLoading}
                  className="w-full py-5 rounded-2xl font-black text-white uppercase tracking-[0.3em] text-[11px] bg-[#C5BAFF] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isLoading ? 'Verifying...' : 'Finalize Registration'}
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {timer > 0 ? (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="animate-spin-slow" />
                      Resend in {timer}s
                    </div>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="text-yellow-500 hover:text-yellow-400 underline underline-offset-4"
                    >
                      Resend Code
                    </button>
                  )}
                  <span className="opacity-20">|</span>
                  <button
                    onClick={() => { setIsVerifying(false); setOtp(['', '', '', '', '', '']); }}
                    className="hover:text-slate-600"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-[#C4D9FF]/30 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FBFBFB] rounded-full border border-[#C4D9FF]">
              <Trophy size={14} className="text-[#C5BAFF]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Certified Fair Play Protocol v4.0</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;