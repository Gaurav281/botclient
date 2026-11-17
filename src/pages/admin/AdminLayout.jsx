import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, selectIsAdmin } from '../../stores/authStore';
import { useGame } from '../../context/GameContext';
import { useAdminOverviewQuery } from '../../hooks/queries';
import { api, setActiveTelegramId } from '../../services/api';
import {
  ShieldCheck,
  ArrowLeft,
  CreditCard,
  Ticket,
  Sliders,
  Users,
  Clock,
  Sparkles,
  RefreshCw,
  Trophy,
  KeyRound,
} from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

export default function AdminLayout() {
  const navigate = useNavigate();
  const gameContext = useGame();
  const storeUser = useAuthStore((s) => s.user);
  const user = storeUser || gameContext?.user;
  const isAuthLoading = gameContext?.loading;

  // Emergency Admin Unlock state for desktop/browser sessions
  const [adminInputId, setAdminInputId] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const adminId = String(import.meta.env.VITE_ADMIN_TELEGRAM_ID || '5802486388').trim();
  const adminUsername = String(import.meta.env.VITE_ADMIN_USERNAME || 'Gaurav_281').toLowerCase().replace('@', '').trim();
  const userUsername = String(user?.username || '').toLowerCase().replace('@', '').trim();
  const userTgId = String(user?.telegramId || '').trim();

  const isAdmin = Boolean(
    user?.isAdmin ||
    userTgId === adminId ||
    (userUsername && userUsername === adminUsername)
  );

  const { data: overviewData, isLoading: loadingOverview, refetch } = useAdminOverviewQuery(isAdmin);
  const stats = overviewData?.stats;

  const handleManualAdminUnlock = async (e) => {
    e.preventDefault();
    if (!adminInputId.trim()) return;

    setIsVerifying(true);
    setUnlockError('');
    try {
      const cleanInput = adminInputId.trim().replace('@', '').toLowerCase();
      if (cleanInput === adminId || cleanInput === adminUsername) {
        // Authenticate as root admin
        setActiveTelegramId(adminId);
        const res = await api.getMe();
        if (res.success && res.user) {
          useAuthStore.getState().setUser(res.user);
          if (gameContext?.setUser) gameContext.setUser(res.user);
          triggerHaptic('success');
          refetch();
        }
      } else {
        setUnlockError('Invalid Admin Telegram ID or Username');
        triggerHaptic('error');
      }
    } catch (err) {
      setUnlockError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // 1. Loading screen while auth establishes
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mb-3" />
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          Verifying Admin Credentials...
        </span>
      </div>
    );
  }

  // 2. Security guard if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-1">Admin Access Required</h2>
        <p className="text-xs text-neutral-400 max-w-sm mb-6 leading-relaxed">
          This portal is restricted to authorized platform administrators (@{adminUsername} / ID: {adminId}).
        </p>

        {/* Browser Quick-Verify Form for Admin */}
        <form onSubmit={handleManualAdminUnlock} className="w-full max-w-xs space-y-2.5 mb-6 text-left">
          <label className="text-[11px] font-mono text-neutral-400 block">
            Admin Verification (Telegram ID / @Username)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 5802486388 or Gaurav_281"
              value={adminInputId}
              onChange={(e) => setAdminInputId(e.target.value)}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </div>
          {unlockError && <p className="text-[11px] text-red-400 font-mono">{unlockError}</p>}
        </form>

        <button
          onClick={() => navigate('/home')}
          className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 font-bold text-xs hover:bg-white/10 active:scale-95 transition-all"
        >
          Return to App
        </button>
      </div>
    );
  }

  const tabs = [
    { to: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/admin/withdrawals', label: 'Withdrawals', icon: CreditCard, count: stats?.pendingWithdrawals },
    { to: '/admin/promo-codes', label: 'Promo Codes', icon: Ticket, count: stats?.activePromoCodes },
    { to: '/admin/categories', label: 'Task Categories', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d12] text-neutral-100 flex flex-col font-sans">
      {/* 1. TOP ADMIN APP BAR */}
      <header className="sticky top-0 z-40 bg-[#121218]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              navigate('/home');
            }}
            className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="Back to App"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white tracking-tight">Admin Console</h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  ROOT
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                @{user?.username || user?.telegramId || 'Admin'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('selection');
            refetch();
          }}
          disabled={loadingOverview}
          className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline font-mono">Refresh</span>
        </button>
      </header>

      {/* 2. STATS OVERVIEW CARDS */}
      <section className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-2xl bg-[#14141c] border border-white/5 p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Pending Payouts</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {stats?.pendingWithdrawals ?? 0}
            </div>
          </div>

          <div className="rounded-2xl bg-[#14141c] border border-white/5 p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Total Players</span>
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {stats?.totalUsers ?? 0}
            </div>
          </div>

          <div className="rounded-2xl bg-[#14141c] border border-white/5 p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Active Promos</span>
              <Ticket className="w-3.5 h-3.5 text-green-400" />
            </div>
            <div className="text-2xl font-black font-mono text-green-400">
              {stats?.activePromoCodes ?? 0}
            </div>
          </div>

          <div className="rounded-2xl bg-[#14141c] border border-white/5 p-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="text-[11px] font-medium">Total Payouts</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black font-mono text-purple-300">
              {stats?.totalWithdrawals ?? 0}
            </div>
          </div>
        </div>
      </section>

      {/* 3. NAVIGATION PILLS */}
      <nav className="px-4 py-2 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-500 text-white font-black">
                  {tab.count}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* 4. SUB-PAGE CONTENT */}
      <main className="flex-1 px-4 py-4 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
