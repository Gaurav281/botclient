import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Gamepad2,
  Share2,
  Coins,
  Tv,
  Ticket,
  Flame,
  RotateCw,
  Smartphone,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatINR, formatPoints } from '../../utils/formatters';
import AddBioLinkModal from '../common/AddBioLinkModal';
import {
  useWeeklyGraphQuery,
  useTasksQuery,
  useLiveTickerQuery,
  useRedeemPromoMutation,
} from '../../hooks/queries';

export default function HomeTab() {
  const { user, setUser, switchTab, showToast } = useGame();
  const [claimingCheckin, setClaimingCheckin] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  // TanStack Query caching & background refetch
  const { data: graphData, refetch: refetchGraph } = useWeeklyGraphQuery();
  const { data: tasksData, refetch: refetchTasks } = useTasksQuery();
  const { data: tickerData } = useLiveTickerQuery();
  const redeemMutation = useRedeemPromoMutation();

  const checkInData = tasksData?.checkIn || null;
  const liveTicker = tickerData?.ticker || [];
  const weeklyData = graphData || {
    todayEarned: 0,
    totalWeekEarned: 0,
    days: [],
  };

  const handleClaimCheckin = async () => {
    if (!checkInData?.canCheckIn) {
      showToast('Already claimed today! Check back tomorrow.', 'info');
      return;
    }

    try {
      setClaimingCheckin(true);
      triggerHaptic('medium');
      const res = await api.dailyCheckIn();
      if (res.success && res.user) {
        setUser(res.user);
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        showToast(res.message, 'success');
        setShowBioModal(false);
        refetchTasks();
        refetchGraph();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setClaimingCheckin(false);
    }
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    triggerHaptic('medium');
    if (!promoCode.trim()) return;

    try {
      await redeemMutation.mutateAsync(promoCode.trim());
      sound.playPowerup();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setPromoCode('');
    } catch (err) {
      // Handled by mutation
    }
  };

  const coins = user?.coins || 0;
  const inrValue = coins / 1000;
  const withdrawableInr = user?.withdrawableBalance || 0;
  const todayEarned = weeklyData.todayEarned || user?.wonToday || 0;

  const streakDays = [
    { day: 'D1', val: 80 },
    { day: 'D2', val: 100 },
    { day: 'D3', val: 125 },
    { day: 'D4', val: 150 },
    { day: 'D5', val: 200 },
    { day: 'D6', val: 300 },
    { day: 'D7', val: 550, isGift: true },
  ];

  const currentStreak = user?.streak || 0;
  const streakIndex = currentStreak % 7;

  // Real 7 days of PTS data
  const daysArray = weeklyData.days.length === 7 ? weeklyData.days : [
    { label: 'D-6', pts: 0 },
    { label: 'D-5', pts: 0 },
    { label: 'D-4', pts: 0 },
    { label: 'D-3', pts: 0 },
    { label: 'D-2', pts: 0 },
    { label: 'D-1', pts: 0 },
    { label: 'Today', pts: todayEarned },
  ];

  const maxPtsEarned = Math.max(100, ...daysArray.map((d) => d.pts));
  const svgWidth = 300;
  const svgHeight = 65;
  const paddingX = 12;
  const usableWidth = svgWidth - paddingX * 2;

  const points = daysArray.map((d, index) => {
    const x = paddingX + (index / (daysArray.length - 1)) * usableWidth;
    const yRatio = Math.min(1, Math.max(0, d.pts / maxPtsEarned));
    const y = 54 - yRatio * 42;
    return { x, y, pts: d.pts, label: d.label };
  });

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    pathD += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      {/* 1. TOTAL BALANCE CARD (PERMANENTLY DARK OBSIDIAN IN BOTH LIGHT & DARK MODES) */}
      <div className="wallet-card-permanent-dark rounded-[32px] p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono tracking-wider text-neutral-400 uppercase font-bold">
            TOTAL BALANCE
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{formatPoints(todayEarned)} today</span>
          </div>
        </div>

        {/* Big Balance Number */}
        <div className="flex items-baseline gap-2.5 my-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-yellow-400">
            <Coins className="w-5 h-5" />
          </div>
          <span className="text-4xl font-black tracking-tight text-white font-mono">
            {formatPoints(coins)}
          </span>
          <span className="text-sm font-bold text-neutral-400 font-mono">PTS</span>
        </div>

        {/* Value Line */}
        <div className="flex items-center gap-2 text-xs text-neutral-300 mb-4 font-medium">
          <span>≈ {formatINR(inrValue)}</span>
          <span>•</span>
          <span className="text-white font-semibold">
            {formatINR(withdrawableInr)} ready to withdraw
          </span>
        </div>

        {/* Real Dynamic 7-Day Graph (Vibrant Green Aesthetic) */}
        <div className="h-16 w-full relative mb-4">
          <svg className="w-full h-full" viewBox="0 0 300 65" preserveAspectRatio="none">
            <defs>
              <linearGradient id="balanceGraphGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={fillD} fill="url(#balanceGraphGrad)" />
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#10b981" />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="8" fill="#10b981" opacity="0.35" />
          </svg>

          {/* Real 7 Day Labels */}
          <div className="flex justify-between text-[11px] text-neutral-400 font-mono mt-1 px-1">
            {daysArray.map((d, idx) => (
              <span
                key={idx}
                className={idx === daysArray.length - 1 ? 'font-black text-white' : ''}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>

        {/* Convert & Withdraw Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => switchTab('wallet')}
            className="py-3.5 rounded-2xl text-xs font-bold bg-[#22222a] text-white border border-white/10 hover:bg-[#2c2c36] active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Convert</span>
          </button>

          <button
            onClick={() => switchTab('wallet')}
            className="py-3.5 rounded-2xl text-xs font-bold bg-white text-black hover:bg-neutral-100 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* 2. DAILY CHECK-IN CARD (Matching Reference Image 2) */}
      <div className="glass-card rounded-[32px] p-6 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white">Daily check-in</h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              {currentStreak}-day streak
            </span>
          </div>

          <button
            onClick={() => {
              if (!checkInData?.canCheckIn) {
                showToast('Already claimed today! Check back tomorrow.', 'info');
                return;
              }
              triggerHaptic('light');
              setShowBioModal(true);
            }}
            disabled={!checkInData?.canCheckIn || claimingCheckin}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md ${
              checkInData?.canCheckIn
                ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95'
                : 'bg-neutral-200 dark:bg-white/10 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {checkInData?.canCheckIn ? `Claim +${streakDays[streakIndex].val}` : 'Claimed'}
          </button>
        </div>

        {/* Telegram Bio Invite Link Prompt (Matching Reference Image 2 & 3) */}
        <div className="mb-4 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/5 px-3.5 py-2.5 flex items-center justify-between text-xs">
          <span className="text-neutral-700 dark:text-neutral-300 font-medium">
            Needs your invite link in your Telegram bio
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowBioModal(true);
            }}
            className="font-bold underline text-black dark:text-white ml-1.5"
          >
            How?
          </button>
        </div>

        {/* 7-Day Streak Pills */}
        <div className="grid grid-cols-7 gap-1.5 pt-1">
          {streakDays.map((item, idx) => {
            const isCompleted = idx < streakIndex;
            const isCurrent = idx === streakIndex;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center py-3 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md font-bold'
                    : isCompleted
                    ? 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/15'
                    : 'bg-neutral-50 dark:bg-[#141418] text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-white/5'
                }`}
              >
                <span className="text-[10px] uppercase font-mono font-bold">{item.day}</span>
                <span className="text-xs font-black mt-1">
                  {item.isGift ? '🎁' : item.val}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PROMO CODE CARD (Matching Reference Image 2) */}
      <div className="glass-card rounded-[28px] p-4 transition-colors">
        <form onSubmit={handlePromoSubmit} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
            <Ticket className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Have a promo code?"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white hover:bg-neutral-300 dark:hover:bg-white/20 active:scale-95 transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 4. QUICK ACTIONS GRID (App Tasks, Play, Redeem, Invite - Square Boxes, Full Text) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            sessionStorage.setItem('preferred_task_cat', 'app_tasks');
            switchTab('tasks');
          }}
          className="aspect-square flex flex-col items-center justify-between p-2.5 rounded-2xl glass-card border border-neutral-200 dark:border-white/10 active:scale-95 transition-all shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="text-center w-full">
            <span className="text-[11px] font-black text-neutral-900 dark:text-white block leading-tight">App Tasks</span>
            <span className="text-[9px] text-emerald-500 font-bold block leading-tight mt-0.5">Earn PTS</span>
          </div>
        </button>

        <button
          onClick={() => switchTab('arena')}
          className="aspect-square flex flex-col items-center justify-between p-2.5 rounded-2xl glass-card border border-neutral-200 dark:border-white/10 active:scale-95 transition-all shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div className="text-center w-full">
            <span className="text-[11px] font-black text-neutral-900 dark:text-white block leading-tight">Play</span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium block leading-tight mt-0.5">Arena</span>
          </div>
        </button>

        <button
          onClick={() => switchTab('tasks')}
          className="aspect-square flex flex-col items-center justify-between p-2.5 rounded-2xl glass-card border border-neutral-200 dark:border-white/10 active:scale-95 transition-all shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-center w-full">
            <span className="text-[11px] font-black text-neutral-900 dark:text-white block leading-tight">Redeem</span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium block leading-tight mt-0.5">Promo</span>
          </div>
        </button>

        <button
          onClick={() => switchTab('refer')}
          className="aspect-square flex flex-col items-center justify-between p-2.5 rounded-2xl glass-card border border-neutral-200 dark:border-white/10 active:scale-95 transition-all shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="text-center w-full">
            <span className="text-[11px] font-black text-neutral-900 dark:text-white block leading-tight">Invite</span>
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-medium block leading-tight mt-0.5">+400 PTS</span>
          </div>
        </button>
      </div>

      {/* 5. REAL LIVE ACTIVITY TICKER (Matching Reference Image 2) */}
      <div className="flex items-center gap-2 rounded-2xl glass-card px-4 py-3 overflow-hidden transition-colors">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-black uppercase shrink-0">LIVE</span>
        <div className="text-xs text-neutral-700 dark:text-neutral-300 truncate font-medium">
          {liveTicker.length > 0 ? (
            <span>
              {liveTicker[0].name} won <span className="font-black text-neutral-900 dark:text-white">+{liveTicker[0].amount} PTS</span> in Asteroid Blaster
            </span>
          ) : (
            <span>Blast asteroids and defeat the Mothership boss to earn rewards!</span>
          )}
        </div>
      </div>

      {/* 6. OPEN TASKS HEADER & PREVIEW (Matching Reference Image 2) */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-neutral-900 dark:text-white">Open tasks</h3>
            <span className="rounded-full bg-neutral-200 dark:bg-white/10 px-2 py-0.5 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 font-mono">
              6
            </span>
          </div>

          <button
            onClick={() => switchTab('tasks')}
            className="text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white flex items-center gap-0.5"
          >
            <span>All tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Adsgram Task Card */}
        <div className="glass-card rounded-[28px] p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Adsgram</h4>
                <span className="rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-mono text-[10px] font-bold px-2 py-0.5">
                  +120 PTS
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Watch sponsor video</p>
            </div>
          </div>

          <button
            onClick={() => switchTab('tasks')}
            className="btn-primary-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            Watch
          </button>
        </div>
      </div>

      {/* Add Bio Link Bottom Sheet (Matching Reference Image 3) */}
      <AddBioLinkModal
        isOpen={showBioModal}
        onClose={() => setShowBioModal(false)}
        onClaim={handleClaimCheckin}
        claiming={claimingCheckin}
        referralCode={user?.referralCode}
        showToast={showToast}
      />
    </div>
  );
}
