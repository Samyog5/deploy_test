import React, { useState, useEffect } from 'react';
// Added RefreshCw to the imports from lucide-react
import { Trophy, ArrowLeft, RotateCcw, Sparkles, Coins, Zap, Star, Gift, XCircle, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { User, Reward } from '../types';
import { useNavigate } from 'react-router-dom';

interface SpinWheelPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onRefresh?: () => void;
}


const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : '';

const DEFAULT_REWARDS: Reward[] = [
  { id: 0, label: '₹10 Bonus', type: 'balance', value: 10, weight: 40 },
  { id: 1, label: 'Try Again', type: 'none', value: 0, weight: 20 },
  { id: 2, label: '₹50 Bonus', type: 'balance', value: 50, weight: 15 },
  { id: 3, label: 'Voucher Pack', type: 'none', value: 0, weight: 10 },
  { id: 4, label: 'Better Luck', type: 'none', value: 0, weight: 10 },
  { id: 5, label: '₹500 MEGA', type: 'balance', value: 500, weight: 1, premium: true },
  { id: 6, label: 'Jackpot Entry', type: 'none', value: 0, weight: 2 },
  { id: 7, label: '₹100 Bonus', type: 'balance', value: 100, weight: 2 }
];

// Icons with custom colors
const ICONS = [
  <Coins size={20} className="text-[#C5BAFF]" />, <RotateCcw size={20} className="text-slate-400" />, <Coins size={20} className="text-[#C5BAFF]" />, <Gift size={20} className="text-[#C4D9FF]" />,
  <XCircle size={20} className="text-red-300" />, <Star size={20} className="text-yellow-400" />, <Trophy size={20} className="text-[#C5BAFF]" />, <TrendingUp size={20} className="text-[#C4D9FF]" />
];

const COLORS = [
  { bg: '#FBFBFB', text: '#1e293b' }, { bg: '#E8F9FF', text: '#334155' },
  { bg: '#FBFBFB', text: '#1e293b' }, { bg: '#C4D9FF', text: '#1e293b' },
  { bg: '#FBFBFB', text: '#1e293b' }, { bg: '#C5BAFF', text: '#ffffff' },
  { bg: '#E8F9FF', text: '#334155' }, { bg: '#FBFBFB', text: '#1e293b' }
];

const SPIN_COOLDOWN = 24 * 60 * 60 * 1000;

const SpinWheelPage: React.FC<SpinWheelPageProps> = ({ user, onUpdateUser, onRefresh }) => {
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailySpinLimit, setDailySpinLimit] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<Reward | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const navigate = useNavigate();

  const fetchWheelConfig = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/wheel-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.rewards && Array.isArray(data.rewards)) {
          setRewards(data.rewards);
        }
        if (data.settings && typeof data.settings.dailySpinLimit === 'number') {
          setDailySpinLimit(data.settings.dailySpinLimit);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wheel configuration', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchWheelConfig();
    // Synchronize balance and spin state on mount
    if (onRefresh) onRefresh();
  }, []);

  const calculateTimeLeft = () => {
    if (!user.spinWindowStart) return null;
    const now = Date.now();
    const diff = SPIN_COOLDOWN - (now - user.spinWindowStart);

    // Only show cooldown if limit is reached
    const spinsLeft = dailySpinLimit - (user.spinCount || 0);
    if (spinsLeft > 0) return null;

    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [user.spinCount, user.spinWindowStart, dailySpinLimit]);

  const handleSpin = async () => {
    if (isSpinning || timeLeft || rewards.length === 0) return;

    setIsSpinning(true);
    setWonReward(null);

    try {
      const response = await fetch(`${API_BASE}/api/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        const resultRewardId = data.reward.id;
        const rewardIndex = rewards.findIndex(r => r.id === resultRewardId);
        const extraRounds = 10 + Math.floor(Math.random() * 5);
        const targetRotation = rotation + (extraRounds * 360) + (360 - (rewardIndex * 45));

        setRotation(targetRotation);

        setTimeout(() => {
          setIsSpinning(false);
          setWonReward(data.reward);
          onUpdateUser({
            ...user,
            balance: data.newBalance,
            lastSpinTimestamp: data.lastSpinTimestamp,
            spinCount: data.spinCount,
            spinWindowStart: data.spinWindowStart
          });
        }, 5000);
      } else {
        throw new Error(data.error || 'Spin failed');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Encryption synchronization error.');
      setIsSpinning(false);
    }
  };

  const spinsRemaining = Math.max(0, dailySpinLimit - (user.spinCount || 0));

  if (loadingConfig && rewards.length === 0) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-[#C5BAFF] animate-spin" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Vault Protocols...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FBFBFB] text-slate-800 overflow-y-auto relative flex flex-col pb-12">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#E8F9FF]/50 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between relative z-10 w-full max-w-7xl mx-auto flex-shrink-0">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-full border border-[#C4D9FF] transition-all uppercase text-[10px] font-black tracking-widest group text-slate-600">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO VAULT
        </button>
        <div className="bg-white border border-[#C4D9FF] px-5 py-2 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-[#E8F9FF] rounded-xl"><Coins size={20} className="text-[#C5BAFF]" /></div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vault Balance</p>
            <p className="text-sm font-black tracking-tight leading-none text-slate-800">₹ {(user.balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-start px-4 pt-6 md:pt-10">
        <div className="text-center mb-10 md:mb-12 relative">
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter uppercase mb-2">
            BOSS <span className="text-[#C5BAFF]">LUCKY WHEEL</span>
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-2">
              <Sparkles size={14} /> EXCLUSIVE DAILY REWARDS <Sparkles size={14} />
            </p>
            <div className="mt-2 bg-[#E8F9FF] border border-[#C4D9FF] px-4 py-1.5 rounded-full">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                Spins Left Today: <span className="text-[#C5BAFF] text-sm ml-2">{spinsRemaining} / {dailySpinLimit}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Wheel Assembly */}
        <div className="relative w-[85vw] h-[85vw] max-w-[440px] max-h-[440px] md:w-[48vh] md:h-[48vh] mb-8">
          <div className="absolute -inset-6 md:-inset-10 border-[12px] md:border-[16px] border-white rounded-full shadow-lg z-0 bg-white">
            {[...Array(24)].map((_, i) => (
              <div key={i} className={`absolute w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${isSpinning ? 'animate-pulse bg-[#C5BAFF]' : 'bg-[#E8F9FF]'}`}
                style={{ top: '50%', left: '50%', transform: `rotate(${i * 15}deg) translateY(calc(-42.5vw - 4px))`, transformOrigin: '0 0', marginTop: '-1.5px', marginLeft: '-1.5px' }}
              />
            ))}
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 md:-translate-y-6 z-40 drop-shadow-md">
            <div className="w-8 h-12 md:w-10 md:h-14 bg-gradient-to-b from-[#C4D9FF] to-[#C5BAFF] clip-path-pointer border-x border-white"></div>
          </div>

          <div
            className="w-full h-full rounded-full border-[6px] md:border-[8px] border-white relative overflow-hidden transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1) shadow-xl z-10"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {rewards.map((reward, i) => (
              <div
                key={i}
                className="absolute top-0 left-0 w-full h-full origin-center flex items-start justify-center"
                style={{
                  transform: `rotate(${i * 45}deg)`,
                  clipPath: 'polygon(50% 50%, 29.3% 0%, 70.7% 0%)',
                  backgroundColor: COLORS[i % COLORS.length].bg,
                }}
              >
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-r border-[#E8F9FF]" style={{ transform: 'rotate(22.5deg)' }}></div>
                <div className="mt-[12%] flex flex-col items-center gap-1.5 md:gap-2">
                  <div className="text-slate-600 p-1 bg-white/50 rounded-full">
                    {ICONS[i % ICONS.length]}
                  </div>
                  <p className="text-[8px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-tight whitespace-nowrap" style={{ color: COLORS[i % COLORS.length].text }}>
                    {reward.label}
                  </p>
                </div>
              </div>
            ))}

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 bg-white rounded-full border-4 md:border-[6px] border-[#C5BAFF] flex items-center justify-center shadow-lg z-30">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#E8F9FF] flex items-center justify-center animate-pulse border border-[#C4D9FF]">
                <Trophy size={28} className="text-[#C5BAFF]" />
              </div>
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="mt-8 md:mt-12 w-full flex justify-center pb-8 px-4">
          <button
            onClick={handleSpin}
            disabled={isSpinning || !!timeLeft}
            className={`relative w-full max-w-md py-4 md:py-6 rounded-full font-black text-xl md:text-3xl uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 border-b-[8px] ${timeLeft ? 'bg-slate-200 border-slate-300 text-slate-400' : isSpinning ? 'bg-[#C5BAFF] border-[#b0a0ff] opacity-50' : 'bg-[#C4D9FF] border-[#a3c2ff] text-slate-800 hover:bg-[#a3c2ff]'
              }`}
          >
            <span className="flex items-center justify-center gap-4">
              {isSpinning ? <RefreshCw className="animate-spin" size={24} /> : timeLeft ? <Clock size={24} /> : <Zap className="animate-pulse" size={24} />}
              {isSpinning ? 'SPINNING...' : timeLeft ? `RETRY IN: ${timeLeft}` : 'SPIN NOW'}
            </span>
          </button>
        </div>
      </div>

      {/* Result Modal */}
      {wonReward && !isSpinning && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 fade-in">
          <div className="bg-white border border-[#C4D9FF] rounded-[2.5rem] p-10 md:p-12 w-full max-w-xs md:max-w-sm text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4D9FF] to-[#C5BAFF]"></div>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#E8F9FF] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#C4D9FF] shadow-sm">
              {wonReward.value > 0 ? (
                <Trophy size={48} className="text-[#C5BAFF] animate-bounce" />
              ) : (
                <RotateCcw size={48} className="text-slate-400 animate-spin-slow" />
              )}
            </div>
            <h2 className="text-[10px] font-black text-[#C5BAFF] uppercase tracking-[0.3em] mb-2">
              {wonReward.value > 0 ? 'RESULT UNLOCKED' : 'SYSTEM UPDATE'}
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter mb-8 leading-none">{wonReward.label}</h3>
            <button
              onClick={() => setWonReward(null)}
              className={`w-full py-5 rounded-xl font-black uppercase tracking-widest text-sm shadow-md active:scale-95 transition-all ${wonReward.value > 0
                ? 'bg-[#C4D9FF] text-slate-800 hover:bg-[#a3c2ff]'
                : 'bg-slate-100 border border-slate-200 text-slate-400 hover:bg-slate-200'
                }`}
            >
              {wonReward.value > 0 ? 'CLAIM REWARD' : 'TRY AGAIN'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .clip-path-pointer { clip-path: polygon(100% 0%, 0% 0%, 50% 100%); }
        html { scroll-behavior: smooth; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SpinWheelPage;