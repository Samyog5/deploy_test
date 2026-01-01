import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  ShieldCheck,
  Zap,
  Trophy,
  Users,
  Smartphone,
  ChevronRight,
  Star,
  Menu,
  X,
  Flame,
  Wallet,
  Activity,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ShieldAlert,
  Mail,
  // Added RefreshCw to the imports
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Gamepad2,
  Gift,
  Newspaper,
  Info,
  FileWarning,
  Dices,
  Coins,
  Ticket,
  Gem,
  Ghost,
  Clapperboard,
  Grip
} from 'lucide-react';
import { User, AnnouncementConfig } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onRefresh?: () => void;
}

const APK_LINK = "https://d2q5333jlh81mc.cloudfront.net/BossRummy.apk";
const SUPPORT_LINK = "https://chatlink.chatslink.net/widget/standalone.html?eid=fbe04416965f737fb366d3a46c061ce9&language=en";
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : '';

const FEATURES_DATA = [
  {
    id: 0,
    icon: '/assets/task_center/e_01.png',
    title: 'Promo Code',
    desc: "Get exclusive bonuses by entering special promo codes! Whether it's free cash, spins, or entries into tournaments, promo codes are your gateway to surprise rewards. Available for new users, festive events, and loyalty players."
  },
  {
    id: 1,
    icon: '/assets/task_center/e_02.png',
    title: 'Voucher',
    desc: "Claim powerful vouchers to level up your game: Deposit Vouchers - Get bonus cash or extra chips on every deposit. Game Vouchers - Enjoy free spins or entries in specific games like slots or fishing. Easily redeem vouchers inside the app for instant rewards."
  },
  {
    id: 2,
    icon: '/assets/task_center/e_03.png',
    title: 'Tournament',
    desc: "Join thrilling real-time tournaments across Rummy, Slots, Aviator, and more. Timed rounds, Leaderboards with live updates, Win cash, bonuses, or exclusive badges. Enter for glory — and big prizes."
  },
  {
    id: 3,
    icon: '/assets/task_center/e_04.png',
    title: 'Jackpot',
    desc: "Every spin or round you play brings you closer to hitting the Yono jackpot. Progressive pool grows daily. Winners announced live. Play eligible games to qualify. You never know when luck strikes!"
  },
  {
    id: 4,
    icon: '/assets/task_center/e_05.png',
    title: 'Lucky Wheel',
    desc: "Log in daily and take your free shot at the Lucky Wheel. Prizes include: Bonus coins, Free tournament entries, Game vouchers, Real cash boosts. More spins = more chances to win!"
  },
  {
    id: 5,
    icon: '/assets/task_center/e_06.png',
    title: 'Task Center',
    desc: "Daily and weekly missions designed to reward your gameplay: Play 3 Rummy Games, Win 1,000 coins in Slots, Refer a friend today. Each completed task unlocks instant bonuses, vouchers, or XP."
  }
];

const SecurityModal = ({ user, onClose, onUpdateUser }: any) => {
  const [newEmail, setNewEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInitiateChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/initiate-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ currentEmail: user.email, newEmail }),
      });

      // Safely handle non-JSON responses to prevent fetch catch block from triggering generic error
      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.warn("Server returned non-JSON response:", text);
        throw new Error(`Protocol synchronization failed (Status ${res.status}).`);
      }

      if (res.ok) {
        setIsVerifying(true);
      } else {
        setError(data.error || 'Failed to initiate identity change.');
      }
    } catch (err: any) {
      console.error("Initiate Change Error:", err);
      setError(err.message === 'Failed to fetch'
        ? 'Network failure. Please check vault connections (Port 3001).'
        : `Vault error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) return setError('Enter full 6-digit access code.');

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ currentEmail: user.email, otp: otpCode }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Verification protocols failed (Status ${res.status}).`);
      }

      if (res.ok) {
        setSuccess('Identity Verified! Protocol updated in database.');
        onUpdateUser(data.user);
        setTimeout(onClose, 2000);
      } else {
        setError(data.error || 'Identity verification failed.');
      }
    } catch (err: any) {
      console.error("Verify Change Error:", err);
      setError('Vault sync error. Check database availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] border border-[#E8F9FF] shadow-2xl overflow-hidden animate-scale-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4D9FF] to-[#C5BAFF]"></div>

        <div className="p-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Vault <span className="text-[#C5BAFF]">Security</span></h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Adjustment</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          <div className="mb-8 p-6 bg-[#FBFBFB] rounded-3xl border border-[#E8F9FF]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Identity</p>
            <p className="text-sm font-black text-slate-800 truncate">{user.email}</p>
          </div>

          {!isVerifying ? (
            <form onSubmit={handleInitiateChange} className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">New Email Identity</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5BAFF] transition-colors" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white border border-[#C4D9FF] rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:outline-none focus:border-[#C5BAFF] transition-all text-sm font-bold placeholder:text-slate-300"
                    placeholder="new.legend@vault.com"
                    required
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-3 px-1 leading-relaxed uppercase tracking-wider italic">
                  * New identity will remain unverified until access code confirmation.
                </p>
              </div>

              {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-400 flex items-center gap-3 animate-pulse"><ShieldAlert size={16} /> {error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#C4D9FF] hover:bg-[#a3c2ff] text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />} Update Protocol
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="p-6 bg-[#E8F9FF] border border-[#C4D9FF] rounded-3xl text-center">
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  Identity verification code sent to:<br />
                  <span className="text-slate-900 font-black">{newEmail}</span>
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => e.key === 'Backspace' && !otp[i] && i > 0 && otpRefs.current[i - 1]?.focus()}
                    className="w-full h-14 bg-white border border-[#C4D9FF] rounded-xl text-center text-xl font-black text-slate-800 focus:border-[#C5BAFF] outline-none transition-all"
                  />
                ))}
              </div>

              {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 flex items-center gap-3"><ShieldAlert size={16} /> {error}</div>}
              {success && <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-[10px] font-bold text-green-600 flex items-center gap-3 animate-bounce"><CheckCircle2 size={16} /> {success}</div>}

              <div className="space-y-4">
                <button
                  onClick={handleVerifyChange}
                  disabled={loading}
                  className="w-full py-5 bg-[#C5BAFF] hover:bg-[#b0a0ff] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all"
                >
                  {loading ? 'Confirming...' : 'Finalize Verification'}
                </button>
                <button
                  onClick={() => setIsVerifying(false)}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Change Email Address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ isScrolled, toggleMenu, isMenuOpen, onLogout, user, onOpenSecurity }: any) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ProfileContent = () => (
    <>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-t-3xl"></div>
      <div className="flex items-center gap-5 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shadow-lg">
          <UserIcon className="text-yellow-400" size={28} />
        </div>
        <div>
          <h4 className="text-base font-black text-white uppercase tracking-tight leading-none mb-1">{user.name}</h4>
          <p className="text-[10px] text-emerald-100/40 font-bold truncate max-w-[180px] tracking-widest uppercase">{user.email}</p>
        </div>
      </div>
      <div className="space-y-4 mb-8">
        <div className="bg-[#002e2c]/60 rounded-2xl p-4 border border-emerald-400/10 shadow-inner">
          <p className="text-[9px] font-black text-yellow-500/50 uppercase tracking-[0.2em] mb-2">Vault Balance</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white">₹ {(user.balance || 0).toFixed(2)}</span>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Wallet size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1">
          <div
            onClick={() => { onOpenSecurity(); setIsProfileOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-emerald-400/10"
          >
            <ShieldCheck size={18} className="text-emerald-400 group-hover:text-yellow-400 transition-colors" />
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100/70 group-hover:text-white">Account Security</span>
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-emerald-400/10">
            <Activity size={18} className="text-emerald-400 group-hover:text-yellow-400 transition-colors" />
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100/70 group-hover:text-white">Transaction Logs</span>
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-900 hover:from-red-500 hover:to-red-800 text-white font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all shadow-[0_10px_20px_rgba(153,27,27,0.4)] active:scale-95 border border-red-500/20"
      >
        <LogOut size={16} /> Terminate Session
      </button>
    </>
  );

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 border-b border-transparent ${isScrolled ? 'bg-[#FBFBFB]/95 backdrop-blur-xl border-[#C4D9FF] shadow-sm py-3' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img
            src="/assets/logo.png"
            alt="Boss Rummy Logo"
            className="h-12 w-auto drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            onError={(e: any) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/50x50?text=BOSS"; }}
          />
          <div className="hidden sm:flex flex-col -space-y-1">
            <span className="text-xl font-bold text-slate-800 tracking-wider">BOSS</span>
            <span className="text-xs font-bold text-[#C5BAFF] tracking-[0.2em] uppercase">Rummy</span>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          {['Games', 'Features', 'Winners', 'Spin Wheel'].map((item) => {
            if (item === 'Spin Wheel') {
              return (
                <button
                  key={item}
                  onClick={() => navigate('/lucky-spin')}
                  className="px-5 py-2 text-slate-600 hover:text-slate-900 hover:bg-[#C4D9FF]/20 rounded-full transition-all text-sm font-medium tracking-wide flex items-center gap-2"
                >
                  {item}
                </button>
              );
            }
            return (
              <a key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 text-slate-600 hover:text-slate-900 hover:bg-[#C4D9FF]/20 rounded-full transition-all text-sm font-medium tracking-wide">
                {item}
              </a>
            );
          })}

          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-white/10 relative">
            <a href={APK_LINK} className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-500 text-slate-950 px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all transform hover:-translate-y-1 flex items-center gap-2 border border-yellow-400/50 relative overflow-hidden group">
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <Download size={18} className="animate-pulse relative z-10" />
              <span className="tracking-wide relative z-10 text-sm font-black uppercase">DOWNLOAD APK</span>
            </a>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all border ${isProfileOpen ? 'bg-[#C5BAFF] text-white border-[#C4D9FF]' : 'bg-[#E8F9FF] text-slate-700 border-[#C4D9FF] hover:border-[#C5BAFF]'
                  }`}
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#C4D9FF] shadow-sm">
                  <UserIcon size={16} className={isProfileOpen ? 'text-white' : 'text-[#C5BAFF]'} />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-[9px] font-black uppercase tracking-tighter leading-none mb-0.5 opacity-60">Guardian</p>
                  <p className="text-xs font-black truncate max-w-[120px] tracking-tight uppercase">{user.name}</p>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute top-full mt-4 right-0 w-80 bg-[#004d40] border border-emerald-400/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl p-7 z-[60] fade-in">
                  <ProfileContent />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => { setIsProfileOpen(!isProfileOpen); if (isMenuOpen) toggleMenu(); }}
            className={`p-2 rounded-lg transition-all border ${isProfileOpen ? 'bg-yellow-500 text-[#00241d] border-yellow-400' : 'text-yellow-400 border-transparent hover:bg-white/5'}`}
          >
            <UserIcon size={22} />
          </button>
          <button
            onClick={() => { toggleMenu(); if (isProfileOpen) setIsProfileOpen(false); }}
            className="text-white p-2 rounded-lg hover:bg-emerald-500/10 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isProfileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#00241d]/80 backdrop-blur-xl flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0" onClick={() => setIsProfileOpen(false)}></div>
          <div className="relative w-full max-sm bg-[#004d40] border border-emerald-400/30 rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.9)] p-7 overflow-hidden animate-slide-up">
            <button onClick={() => setIsProfileOpen(false)} className="absolute top-6 right-6 text-emerald-100/50 hover:text-white transition-colors p-2"><X size={20} /></button>
            <ProfileContent />
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="md:hidden bg-[#005c4b] border-t border-emerald-400/20 absolute w-full shadow-2xl backdrop-blur-xl z-[90] fade-in">
          <div className="px-4 pt-4 pb-8 space-y-2">
            {['Games', 'Features', 'Winners', 'Spin Wheel'].map((item) => {
              if (item === 'Spin Wheel') {
                return (
                  <button key={item} onClick={() => { navigate('/lucky-spin'); toggleMenu(); }} className="block w-full text-left px-6 py-5 text-lg font-black text-emerald-100 hover:text-white hover:bg-white/5 rounded-2xl border border-transparent hover:border-emerald-500/20 uppercase tracking-widest transition-all flex items-center gap-4">
                    {item}
                  </button>
                );
              }
              return (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={toggleMenu} className="block px-6 py-5 text-lg font-black text-emerald-100 hover:text-white hover:bg-white/5 rounded-2xl border border-transparent hover:border-emerald-500/20 uppercase tracking-widest transition-all">
                  {item}
                </a>
              );
            })}
            <div className="pt-4 border-t border-white/10 mt-2">
              <a href={APK_LINK} className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-[#00241d] py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                <Download size={22} className="animate-bounce" /> <span>INSTALL NOW</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};


const RecommendedGames = () => {
  // Helper for icons since we don't have the assets
  const GameIcon = ({ icon: Icon, color = "text-emerald-700" }: any) => (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-800 to-black flex items-center justify-center border-2 border-yellow-500 shadow-lg mb-2">
      <Icon size={32} className="text-yellow-400" />
    </div>
  );
  // Mock Crown and Spade if not imported or use generics
  const Crown = ({ size, className }: any) => <Trophy size={size} className={className} />;
  const Spade = ({ size, className }: any) => <Gamepad2 size={size} className={className} />;

  const games = [
    { id: 1, title: 'INR Rummy', badge: 'NEW', badgeColor: 'bg-yellow-500', icon: Dices, countdown: '03 11 19 27' },
    { id: 2, title: 'BossRummy', badge: 'HOT', badgeColor: 'bg-red-500', icon: Crown, isHot: true },
    { id: 3, title: 'Slots Winner', badge: 'HOT', badgeColor: 'bg-red-500', icon: Ticket },
    { id: 4, title: 'Jaiho Rummy', icon: Spade },
    { id: 5, title: 'Jaiho Arcade', icon: Gamepad2 },
    { id: 6, title: 'Share Slots', icon: Coins },
    { id: 7, title: 'Ever777', icon: Gem },
    { id: 8, title: 'Gogo Rummy', icon: Ghost },
    { id: 9, title: 'Yono Rummy', icon: Grip },
    { id: 10, title: 'Bingo101', icon: Clapperboard },
    { id: 11, title: 'Spin Crush', icon: Zap },
    { id: 12, title: 'Spin Gold', icon: Star },
  ];

  return (
    <section className="bg-[#E8F9FF] pb-12 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-slate-800 mb-8">Recommended by our experts</h2>

        <div className="flex overflow-x-auto gap-4 pb-8 scrollbar-hide px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {games.map((game: any) => (
            <div key={game.id} className="flex-none w-32 md:w-40 flex flex-col items-center bg-white rounded-xl p-3 shadow-sm border border-[#C4D9FF] hover:shadow-md transition-shadow cursor-pointer relative mt-3">
              {/* Badge */}
              {game.badge && (
                <div className={`absolute -top-3 right-2 ${game.badgeColor} text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm z-10 uppercase tracking-wider`}>
                  {game.badge}
                </div>
              )}

              {/* Icon/Image Placeholder */}
              <div className="mb-2 transition-transform hover:scale-110 duration-300">
                {game.icon ? <GameIcon icon={game.icon} /> : <GameIcon icon={Gamepad2} />}
              </div>

              {/* Title */}
              <h3 className="text-slate-800 font-bold text-xs md:text-sm text-center leading-tight mb-3 h-8 flex items-center justify-center break-words w-full">
                {game.title}
              </h3>

              {/* Action Button */}
              {game.countdown ? (
                <div className="w-full bg-[#C5BAFF] text-white font-black text-[10px] md:text-xs py-2 rounded flex justify-center gap-1 shadow-sm">
                  {game.countdown}
                </div>
              ) : (
                <button className="w-full bg-[#C4D9FF] hover:bg-[#a3c2ff] text-slate-900 font-bold text-xs md:text-sm py-1.5 rounded shadow-sm transition-colors">
                  Play
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Hero = () => {
  return (
    <section className="bg-[#FBFBFB] py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">

        {/* Search Bar */}
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-sm p-2 flex items-center mb-16 border border-[#C4D9FF]">
          <input
            type="text"
            placeholder="What you want to search ?"
            className="flex-grow px-4 py-3 text-slate-600 focus:outline-none text-lg bg-transparent"
          />
          <button className="bg-[#C5BAFF] hover:bg-[#b0a0ff] text-white px-10 py-3 rounded-md font-medium text-lg transition-colors shadow-md">
            Search
          </button>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none text-[#C4D9FF]" style={{ textShadow: '2px 2px 0px #a0b6e6' }}>
          Get the Truth.
          <br />
          <span className="text-[#C5BAFF]" style={{ textShadow: '2px 2px 0px #a496e9' }}>Then Play.</span>
        </h1>

        {/* Subheading */}
        <p className="text-slate-500 text-lg md:text-xl font-medium mb-12 max-w-4xl leading-relaxed">
          With over 18 years of experience, Pro Safe Bet is your source for reliable and useful information, accurate expert ratings, and genuine player reviews.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
          {[
            { title: "Casinos", icon: Gamepad2, color: "text-[#C4D9FF]" },
            { title: "Bonuses", icon: Gift, color: "text-[#C5BAFF]" },
            { title: "Games News", icon: Newspaper, color: "text-[#C4D9FF]" },
            { title: "About", icon: Info, color: "text-slate-400" },
            { title: "Complaints", icon: FileWarning, color: "text-red-300" },
            { title: "Community", icon: Users, color: "text-blue-300" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-[#E8F9FF] hover:border-[#C4D9FF] rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:-translate-y-1 shadow-sm hover:shadow-md group h-32">
              <item.icon size={32} className={`${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-slate-600 font-medium text-sm">{item.title}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};


const FeaturesSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((prev) => (prev + 1) % FEATURES_DATA.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="features" className="py-24 bg-[#FBFBFB] relative">
      <div className="absolute inset-0 opacity-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="md:border-l-4 md:border-[#C4D9FF] md:pl-4 text-center md:text-left mb-10">
          <h2 className="text-4xl font-bold text-slate-800 uppercase">Features</h2>
        </div>
        <div className="grid grid-cols-6 gap-1 md:gap-4 mb-8 md:mb-14 relative z-10">
          {FEATURES_DATA.map((feature, idx) => (
            <div key={feature.id} onClick={() => setActiveFeature(idx)} className="flex flex-col items-center cursor-pointer group relative">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-32 md:h-32 rounded-xl md:rounded-2xl flex items-center justify-center border-2 transition-all duration-300 shadow-md ${activeFeature === idx ? 'border-[#C4D9FF] bg-white scale-110 shadow-lg' : 'border-slate-100 bg-white'}`}>
                <img src={feature.icon} alt={feature.title} className="w-7 h-7 sm:w-10 sm:h-10 md:w-20 md:h-20 object-contain" />
              </div>
              <span className={`mt-2 md:mt-3 text-[9px] sm:text-xs md:text-sm font-bold tracking-wide transition-colors text-center leading-tight break-words w-full ${activeFeature === idx ? 'text-[#C4D9FF]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {feature.title}
              </span>
              {activeFeature === idx && <div className="absolute -bottom-[2.5rem] md:-bottom-[3.6rem] left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 bg-[#C4D9FF] rotate-45 z-20"></div>}
            </div>
          ))}
        </div>
        <div className="bg-[#C4D9FF] rounded-3xl p-8 md:p-12 border border-[#C5BAFF]/30 shadow-xl relative z-0">
          <h3 className="text-2xl md:text-3xl font-black text-[#FBFBFB] mb-2">{FEATURES_DATA[activeFeature].title}</h3>
          <p className="text-slate-700 leading-relaxed text-lg">{FEATURES_DATA[activeFeature].desc}</p>
        </div>
      </div>
    </section>
  );
};

const ModernFeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="relative group p-[1px] rounded-3xl bg-gradient-to-b from-[#C4D9FF]/50 to-transparent hover:from-[#C5BAFF]/50 transition-all duration-500 hover:-translate-y-2">
    <div className="bg-white h-full rounded-[23px] p-8 relative overflow-hidden shadow-lg border border-[#E8F9FF]">
      <div className="w-16 h-16 bg-[#E8F9FF] rounded-2xl flex items-center justify-center mb-6 border border-[#C4D9FF]/30">
        <Icon className="text-[#C4D9FF] w-8 h-8 group-hover:text-[#C5BAFF] transition-colors" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-[#C4D9FF] transition-colors uppercase tracking-tight">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
    </div>
  </div>
);

const FeaturesGrid = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-[#E8F9FF] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-[#C5BAFF] font-bold tracking-widest uppercase text-sm mb-3">Premium Features</h2>
          <h3 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight">WHY WE ARE #1</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModernFeatureCard icon={Zap} title="Lightning Withdrawals" desc="Automated payment processing system ensures your winnings hit your account in under 60 seconds." />
          <ModernFeatureCard icon={ShieldCheck} title="World-Class Security" desc="ISO Certified RNG & 256-bit SSL encryption. Your data and money are safer than a bank vault." />
          <div onClick={() => navigate('/lucky-spin')} className="cursor-pointer">
            <ModernFeatureCard icon={Star} title="Daily Lucky Spin" desc="Try your luck at our exclusive emerald spin wheel. Prizes include vouchers, bonuses and mega jackpots." />
          </div>
          <ModernFeatureCard icon={Users} title="Referral Empire" desc="Earn up to ₹10,000 per referral. Build your passive income stream by inviting your rummy circle." />
          <ModernFeatureCard icon={Smartphone} title="Battery Optimized" desc="Play for hours without draining your battery. Ultra-lightweight app designed for performance." />
          <ModernFeatureCard icon={Trophy} title="Mega Tournaments" desc="Hourly freerolls and mega jackpot tournaments. Compete with the best and win crores." />
        </div>
      </div>
    </section>
  );
};



const Testimonials = () => (
  <section id="winners" className="py-24 bg-[#FBFBFB] relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-16">
        <h3 className="text-3xl md:text-5xl font-black text-slate-800 uppercase">HALL OF FAME</h3>
        <p className="text-slate-400 mt-4 uppercase font-black text-xs tracking-widest">Real players, real winnings.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Rahul K.", loc: "Mumbai", win: "1.2 Lakhs", quote: "Fastest withdrawal I've ever seen. Money in bank in 30 seconds!", color: "from-[#C4D9FF]", img: "/assets/761A7EFB.png" },
          { name: "Priya S.", loc: "Bangalore", win: "45,000", quote: "The interface is so premium. Feels like playing in a real casino.", color: "from-[#C5BAFF]", img: "/assets/9B0DD21A.png" },
          { name: "Amit V.", loc: "Delhi", win: "85,000", quote: "VIP support is actually VIP. They helped me instantly at 2 AM.", color: "from-[#E8F9FF]", img: "/assets/936E3920.png" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-[#E8F9FF] rounded-3xl p-8 shadow-lg relative overflow-hidden flex flex-col group hover:-translate-y-2 transition-all">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color} to-transparent`}></div>
            <p className="text-slate-600 italic mb-8 text-lg flex-grow">"{item.quote}"</p>
            <div className="flex items-center gap-4 border-t border-slate-100 pt-6">
              <img src={item.img} alt={item.name} className="w-14 h-14 rounded-full border border-slate-100" />
              <div>
                <h5 className="font-bold text-slate-800 uppercase text-lg">{item.name}</h5>
                <p className="text-xs text-slate-400 uppercase font-bold">{item.loc}</p>
              </div>
              <div className="ml-auto text-right text-slate-800 font-black text-xl">₹ {item.win}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-[#E8F9FF] text-slate-500 pt-20 pb-10 border-t border-[#C4D9FF]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-3 gap-12 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <img src="/assets/logo.png" alt="Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-slate-800 tracking-wide uppercase">BOSS<span className="text-[#C5BAFF]">RUMMY</span></span>
          </div>
          <p className="mb-8 max-w-sm leading-relaxed text-slate-500 font-medium">The gold standard in online real-money gaming. Fair play certified, secure, and built for champions.</p>
        </div>
        <div>
          <h4 className="text-slate-800 font-bold mb-6 uppercase text-sm tracking-widest">Legal</h4>
          <ul className="space-y-3 text-sm font-medium uppercase tracking-widest text-[11px] font-black">
            <li><a href="#" className="hover:text-[#C4D9FF] transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-[#C4D9FF] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#C4D9FF] transition-colors">Fair Play Policy</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-slate-800 font-bold mb-6 uppercase text-sm tracking-widest">Secure Payment</h4>
          <div className="grid grid-cols-3 gap-2">
            {["/assets/B26B6BBB.png", "/assets/239513C.png", "/assets/B89814B2.png", "/assets/ED6B310C.png", "/assets/62D3E387.png", "/assets/FD8E2BC9.png"].map((src, i) => (
              <img key={i} src={src} alt="Payment" className="h-10 object-contain opacity-80 mix-blend-multiply" />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#C4D9FF] pt-8 flex flex-col md:flex-row justify-between items-center text-sm font-medium text-slate-400 uppercase tracking-widest text-[10px] font-black">
        <p>&copy; 2025 Boss Rummy. All rights reserved.</p>
        <p>Crafted for Legends.</p>
      </div>
    </div>
  </footer>
);

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser, onRefresh }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const navigate = useNavigate();

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/announcement`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncement(data);

        // Smart Check: Show if enabled AND (hasn't been seen OR the image has changed since last seen)
        if (data && data.enabled) {
          const lastSeenImage = sessionStorage.getItem('boss_announcement_image');
          if (!lastSeenImage || lastSeenImage !== data.imageUrl) {
            setShowPopup(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync broadcast protocols.');
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Trigger synchronization with server on mount
    if (onRefresh) onRefresh();
    fetchAnnouncement();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeAnnouncement = () => {
    setShowPopup(false);
    // Track exactly WHICH image was seen
    if (announcement) {
      sessionStorage.setItem('boss_announcement_image', announcement.imageUrl);
    }
  };

  return (
    <div className="antialiased text-slate-800 bg-[#FBFBFB]">
      <Navbar
        isScrolled={isScrolled}
        toggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
        onLogout={onLogout}
        user={user}
        onOpenSecurity={() => setShowSecurityModal(true)}
      />

      {/* SECURITY MODAL */}
      {showSecurityModal && (
        <SecurityModal
          user={user}
          onClose={() => setShowSecurityModal(false)}
          onUpdateUser={onUpdateUser}
        />
      )}

      {/* ANNOUNCEMENT POPUP - Optimized for 900x628 */}
      {showPopup && announcement && announcement.imageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 fade-in">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={closeAnnouncement}></div>

          <div className="relative w-full max-w-[900px] bg-white rounded-[2rem] sm:rounded-[3rem] border border-[#C4D9FF] overflow-hidden shadow-2xl animate-scale-up aspect-[900/628] max-h-[90vh]">
            {/* Highly Visible Close Button */}
            <button
              onClick={closeAnnouncement}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[210] w-12 h-12 flex items-center justify-center bg-[#C5BAFF] hover:bg-[#b0a0ff] text-white rounded-full shadow-lg transition-all active:scale-90"
              title="Close"
            >
              <X size={28} strokeWidth={4} />
            </button>

            <div className="w-full h-full bg-[#FBFBFB] flex items-center justify-center">
              <img
                src={announcement.imageUrl}
                alt="Boss Rummy Announcement"
                className="w-full h-full object-cover sm:object-contain block"
                onError={(e: any) => e.target.src = 'https://via.placeholder.com/900x628?text=BOSS+RUMMY+ANNOUNCEMENT'}
              />
            </div>
          </div>
        </div>
      )}

      <main>
        <Hero />
        <RecommendedGames />
        <FeaturesSection />
        <FeaturesGrid />
        <Testimonials />
        <section className="py-24 relative overflow-hidden text-center bg-gradient-to-b from-yellow-500 to-amber-600">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '16px 16px' }}></div>
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-4xl md:text-7xl font-black text-[#001a15] mb-6 tracking-tight leading-tight uppercase">READY TO BE THE BOSS?</h2>
            <p className="text-[#001a15]/80 text-lg md:text-xl mb-12 font-bold max-w-2xl mx-auto leading-relaxed">Download the app now and claim your exclusive ₹500 Welcome Bonus!</p>
            <a href={APK_LINK} className="bg-[#000a14] hover:bg-[#001428] text-white px-16 py-6 rounded-full font-black text-xl shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-4 mx-auto w-fit uppercase tracking-widest border border-white/5 group overflow-hidden">
              <Download className="w-8 h-8 group-hover:translate-y-1 transition-transform" /> <span>DOWNLOAD APK</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <div className="fixed bottom-0 w-full bg-[#E8F9FF]/95 backdrop-blur-xl p-4 border-t border-[#C4D9FF] md:hidden z-50 flex items-center justify-between shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <div><p className="text-slate-800 font-black text-sm uppercase tracking-widest">BOSS RUMMY</p><p className="text-[#C5BAFF] text-xs font-bold animate-pulse uppercase">Get ₹500 Bonus</p></div>
        <a href={APK_LINK} className="bg-[#C4D9FF] text-slate-900 px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">DOWNLOAD</a>
      </div>

      <style>{`
        @keyframes scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;