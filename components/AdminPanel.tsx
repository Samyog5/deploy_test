import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Wallet,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldAlert,
  LogOut,
  Search,
  ArrowLeft,
  RefreshCw,
  Dices,
  Settings,
  Percent,
  TrendingUp,
  Save,
  Clock,
  RotateCcw,
  Megaphone,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Eye,
  Upload
} from 'lucide-react';
import { User, Reward, AnnouncementConfig } from '../types';
import { useNavigate } from 'react-router-dom';

interface AdminPanelProps {
  admin: User;
  onLogout: () => void;
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

const AdminPanel: React.FC<AdminPanelProps> = ({ admin, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'players' | 'wheel' | 'announcement'>('players');
  const [users, setUsers] = useState<User[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(DEFAULT_REWARDS);
  const [dailySpinLimit, setDailySpinLimit] = useState(1);
  const [announcement, setAnnouncement] = useState<AnnouncementConfig>({ enabled: false, imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingWheel, setSavingWheel] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/rewards`);
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
      console.error('Failed to fetch rewards', err);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/announcement`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncement({ enabled: !!data.enabled, imageUrl: data.imageUrl || '' });
      }
    } catch (err) {
      console.error('Failed to fetch announcement', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRewards();
    fetchAnnouncement();
  }, []);

  const handleUpdateBalance = async (email: string) => {
    if (!editValue || isNaN(parseFloat(editValue))) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/update-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newBalance: parseFloat(editValue) }),
      });
      if (response.ok) {
        setUsers(users.map(u => u.email === email ? { ...u, balance: parseFloat(editValue) } : u));
        setEditingEmail(null);
      }
    } catch (err) {
      console.error('Failed to update balance', err);
    }
  };

  const handleUpdateWheel = async () => {
    setSavingWheel(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/update-rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedRewards: rewards, dailySpinLimit }),
      });
      if (response.ok) {
        alert('Wheel Probability Protocols Updated Successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Update Failed: ${errorData.error || 'Check server logs.'}`);
      }
    } catch (err) {
      console.error('Failed to update wheel', err);
      alert('Network error connecting to Backend (Port 3001).');
    } finally {
      setSavingWheel(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (savingAnnouncement) return;
    if (!announcement.imageUrl) {
      alert("Please upload an image or provide a link first.");
      return;
    }

    setSavingAnnouncement(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/update-announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(announcement),
      });

      const contentType = response.headers.get("content-type");
      let responseData: any = {};

      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch (e) {
          console.error("JSON Parse Error", e);
        }
      } else {
        const rawText = await response.text();
        console.error("Server returned non-JSON:", rawText);
        if (response.status === 413) {
          alert("Critical: Image data is too large for the server's current limit. Try a smaller file.");
        } else {
          alert(`Server Error ${response.status}: The backend returned an invalid response. Check if the server process is still running.`);
        }
        setSavingAnnouncement(false);
        return;
      }

      if (response.ok) {
        alert('Broadcast Committed Successfully! The banner is now live.');
        fetchAnnouncement(); // Sync UI
      } else {
        // Detailed error alerting
        const errorMsg = responseData.error || `Server status ${response.status}. The asset might be blocked by a proxy or database constraint.`;
        alert(`Broadcast Failed: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Failed to update announcement', err);
      alert('Network Error: The backend server at localhost:3001 is unreachable. Ensure the server is running.');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Improved Image Compression Logic
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error("Canvas context failed"));

          ctx.drawImage(img, 0, 0, width, height);
          // Convert to JPEG with 80% quality for massive size reduction
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress and set
      const compressedUrl = await compressImage(file);
      setAnnouncement(prev => ({ ...prev, imageUrl: compressedUrl }));
    } catch (err) {
      console.error("Compression failed:", err);
      alert("Failed to process image asset.");
    }
  };

  const updateRewardField = (index: number, field: keyof Reward, value: any) => {
    const newRewards = [...rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setRewards(newRewards);
  };

  const totalWeight = rewards.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E8F9FF] rounded-2xl border border-[#C4D9FF]">
              <ShieldAlert className="text-[#C5BAFF]" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">BOSS <span className="text-[#C5BAFF]">RUMMY ADMIN</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Admin Management Protocol v2.6</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white hover:bg-slate-50 border border-[#C4D9FF] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-slate-600">
              <span className="hidden sm:inline">Player View</span> <ArrowLeft size={16} />
            </button>
            <button onClick={onLogout} className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
              <LogOut size={16} /> <span className="hidden sm:inline">Terminate</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-[#C4D9FF] w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'players' ? 'bg-[#C4D9FF] text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={16} /> Player Database
          </button>
          <button
            onClick={() => setActiveTab('wheel')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'wheel' ? 'bg-[#C4D9FF] text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Dices size={16} /> Wheel Master
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'announcement' ? 'bg-[#C4D9FF] text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Megaphone size={16} /> Broadcast Master
          </button>
        </div>

        {activeTab === 'players' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Table */}
            {/* Table */}
            <div className="bg-white/80 backdrop-blur-xl border border-[#C4D9FF] rounded-[2.5rem] overflow-hidden shadow-xl">
              <div className="p-8 border-b border-[#E8F9FF] flex flex-col md:flex-row justify-between items-center gap-6">
                <h2 className="text-xl font-black uppercase tracking-widest text-slate-800">Player Database</h2>
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text" placeholder="Filter IDs..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#FBFBFB] border border-[#C4D9FF] rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:border-[#C5BAFF] transition-all text-slate-800 placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E8F9FF]">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Player</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spins Today</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8F9FF]">
                    {filteredUsers.map(u => (
                      <tr key={u.email} className="hover:bg-[#FBFBFB] transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#E8F9FF] border border-[#C4D9FF] flex items-center justify-center text-[#C5BAFF] font-black">{u.name ? u.name[0] : '?'}</div>
                            <div>
                              <p className="text-sm font-black text-slate-800 uppercase">{u.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {editingEmail === u.email ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number" autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                className="bg-white border border-[#C5BAFF] rounded-lg px-3 py-2 text-sm font-bold text-slate-800 w-28 focus:outline-none"
                              />
                              <button onClick={() => handleUpdateBalance(u.email)} className="p-2 bg-[#C4D9FF] text-slate-900 rounded-lg shadow-sm"><Check size={16} /></button>
                              <button onClick={() => setEditingEmail(null)} className="p-2 bg-red-100 text-red-400 rounded-lg"><X size={16} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-slate-800">₹ {u.balance?.toFixed(2)}</span>
                              <button onClick={() => { setEditingEmail(u.email); setEditValue(u.balance.toString()) }} className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#C5BAFF] transition-all"><Edit2 size={14} /></button>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <RotateCcw size={12} className="text-[#C5BAFF]" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{u.spinCount || 0} / {dailySpinLimit}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wheel' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Wheel Control Header */}
            <div className="bg-gradient-to-r from-white to-[#FBFBFB] border border-[#C4D9FF] rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#C5BAFF]"></div>
              <div className="flex-1">
                <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">Wheel Probability <span className="text-[#C5BAFF]">Protocol</span></h2>
                <p className="text-sm font-bold text-slate-500 max-w-lg mb-6">Configure the 8 segments of the Boss Lucky Wheel. Adjust weights to control win frequency.</p>

                {/* Daily Limit Setting */}
                <div className="bg-[#FBFBFB] border border-[#C4D9FF] rounded-2xl p-6 inline-flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-[#C5BAFF]" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Spin Cap</label>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min="1" max="10" value={dailySpinLimit}
                      onChange={e => setDailySpinLimit(parseInt(e.target.value))}
                      className="w-48 h-2 bg-[#E8F9FF] rounded-lg appearance-none cursor-pointer accent-[#C5BAFF]"
                    />
                    <span className="text-2xl font-black text-[#C5BAFF] w-12">{dailySpinLimit}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">SPINS / 24H</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="px-6 py-4 bg-[#C4D9FF] text-slate-800 rounded-2xl flex flex-col items-center min-w-[180px]">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-slate-600">Total System Weight</p>
                  <p className="text-3xl font-black">{totalWeight}</p>
                </div>
                <button
                  onClick={handleUpdateWheel}
                  disabled={savingWheel}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#C5BAFF] hover:bg-[#b0a0ff] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {savingWheel ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  {savingWheel ? 'Applying Protocols...' : 'Commit Changes'}
                </button>
              </div>
            </div>

            {/* Reward Editor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {rewards.map((reward, idx) => {
                const probability = totalWeight > 0 ? ((reward.weight / totalWeight) * 100).toFixed(1) : '0';
                return (
                  <div key={idx} className="bg-white border border-[#C4D9FF] rounded-3xl p-6 relative group hover:border-[#C5BAFF] transition-all shadow-sm">
                    <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300">SEGMENT #{idx + 1}</div>

                    <div className="mb-6">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Display Label</label>
                      <input
                        type="text" value={reward.label} onChange={e => updateRewardField(idx, 'label', e.target.value)}
                        className="w-full bg-[#FBFBFB] border border-[#C4D9FF] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#C5BAFF] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Value (₹)</label>
                        <input
                          type="number" value={reward.value} onChange={e => updateRewardField(idx, 'value', parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#FBFBFB] border border-[#C4D9FF] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#C5BAFF] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Weight</label>
                        <input
                          type="number" value={reward.weight} onChange={e => updateRewardField(idx, 'weight', parseInt(e.target.value) || 0)}
                          className="w-full bg-[#FBFBFB] border border-[#C4D9FF] rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#C5BAFF] outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-[#FBFBFB] rounded-2xl flex items-center justify-between border border-[#E8F9FF] group-hover:bg-[#E8F9FF] transition-all">
                      <div className="flex items-center gap-2">
                        <Percent size={14} className="text-[#C5BAFF]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Win Chance</span>
                      </div>
                      <span className={`text-xl font-black ${parseFloat(probability) < 5 ? 'text-red-400' : 'text-slate-800'}`}>{probability}%</span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => updateRewardField(idx, 'type', reward.type === 'balance' ? 'none' : 'balance')}
                        className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${reward.type === 'balance' ? 'bg-[#E8F9FF] border-[#C4D9FF] text-[#C5BAFF]' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                      >
                        {reward.type === 'balance' ? 'Add to Balance' : 'No Balance'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'announcement' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Controls */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-[#C4D9FF] rounded-[2.5rem] p-10 shadow-xl">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Announcement <span className="text-[#C5BAFF]">Status</span></h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global visibility toggle</p>
                    </div>
                    <button
                      onClick={() => setAnnouncement(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className="transition-transform active:scale-95"
                    >
                      {announcement.enabled ? (
                        <ToggleRight size={64} className="text-[#C4D9FF]" />
                      ) : (
                        <ToggleLeft size={64} className="text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Banner Asset Source</label>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 text-[9px] font-black text-[#C5BAFF] hover:text-[#C4D9FF] uppercase tracking-widest transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-[#E8F9FF]"
                        >
                          <Upload size={12} /> Upload from Device
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileUpload}
                        />
                      </div>
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={announcement.imageUrl}
                          onChange={(e) => setAnnouncement(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="w-full bg-[#FBFBFB] border border-[#C4D9FF] rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:outline-none focus:border-[#C5BAFF] transition-all text-sm font-bold placeholder:text-slate-300"
                          placeholder="https://example.com/banner.png or uploaded asset data..."
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateAnnouncement}
                      disabled={savingAnnouncement}
                      className="w-full py-5 bg-[#C5BAFF] hover:bg-[#a3c2ff] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {savingAnnouncement ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Commit Broadcast
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-6">
                <div className="bg-white border border-[#C4D9FF] rounded-[2.5rem] p-8 h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <Eye size={16} className="text-[#C5BAFF]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Preview</span>
                  </div>
                  <div className="relative aspect-[3/4] bg-[#FBFBFB] rounded-3xl overflow-hidden border border-[#E8F9FF] shadow-inner group">
                    {announcement.imageUrl ? (
                      <img src={announcement.imageUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <ImageIcon size={48} className="mb-4" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No Image Linked</p>
                      </div>
                    )}
                    {!announcement.enabled && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center text-center p-6">
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] border border-slate-300 px-4 py-2 rounded-full">Broadcast Offline</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-[9px] font-bold text-slate-300 uppercase text-center">Optimized for 900x628 Ratio</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;