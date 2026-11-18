import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { showAdsgramRewardAd } from '../../services/ads';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import {
  useWalletSummaryQuery,
  usePayoutHistoryQuery,
  useRecentActivitiesQuery,
  useWithdrawMutation,
} from '../../hooks/queries';
import {
  Wallet,
  ArrowDownToLine,
  ArrowRightLeft,
  X,
  CreditCard,
  Coins,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Gamepad2,
  CheckCircle2,
  Edit2,
  Clock,
  History,
  AlertCircle,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import AnimatedCountUp from '../common/AnimatedCountUp';
import { formatINR, formatPoints, formatISTTime, formatISTDateTime, formatTimeAgo } from '../../utils/formatters';

export default function WalletTab() {
  const { user, setUser, showToast, refreshUser } = useGame();
  const { data: walletSummary, isLoading } = useWalletSummaryQuery();
  const { data: payoutHistoryData, isLoading: loadingPayouts, refetch: refetchPayoutHistory } = usePayoutHistoryQuery();
  const { data: recentActivitiesData, isLoading: loadingActivities, refetch: refetchRecentActivities } = useRecentActivitiesQuery();
  const withdrawMutation = useWithdrawMutation();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showEditUpiModal, setShowEditUpiModal] = useState(false);
  const [showPayoutHistoryModal, setShowPayoutHistoryModal] = useState(false);
  const [showRecentActivitiesModal, setShowRecentActivitiesModal] = useState(false);
  const [newUpiInput, setNewUpiInput] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('5');

  const payoutHistoryList = payoutHistoryData?.withdrawals || walletSummary?.withdrawals || [];

  useEffect(() => {
    if (walletSummary?.savedUpiId) {
      setUpiId(walletSummary.savedUpiId);
    } else if (user?.savedUpiId) {
      setUpiId(user.savedUpiId);
    }
  }, [walletSummary?.savedUpiId, user?.savedUpiId]);

  // Save new UPI ID
  const handleSaveUpi = async (e) => {
    e.preventDefault();
    const cleanUpi = newUpiInput.trim();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. name@okhdfcbank)', 'error');
      return;
    }
    setSavingUpi(true);
    try {
      const res = await api.updatePreferences({ savedUpiId: cleanUpi });
      if (res.success && res.user) {
        setUser(res.user);
        useAuthStore.getState().setUser(res.user);
        setUpiId(cleanUpi);
        showToast('UPI ID saved successfully!', 'success');
        setShowEditUpiModal(false);
      }
    } catch (err) {
      showToast(err.message || 'Error saving UPI ID', 'error');
    } finally {
      setSavingUpi(false);
    }
  };

  const coins = user?.coins || 0;
  const withdrawable = user?.withdrawableBalance || 0;
  // 1000 PTS = 1 INR
  const totalInr = coins / 1000 + withdrawable;
  const minWithdraw = walletSummary?.minWithdrawInr || 5;

  // Submit Withdrawal Request (with UPI ID and mandatory Adsgram reward ad)
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const finalUpi = (upiId || user?.savedUpiId || '').trim();
    if (!finalUpi || !finalUpi.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm)', 'error');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 5) {
      showToast('Minimum withdrawal is ₹5', 'warning');
      return;
    }

    if (totalInr < amount) {
      showToast(`Insufficient balance. You have ₹${totalInr.toFixed(2)} (${formatPoints(coins)} PTS).`, 'error');
      return;
    }

    triggerHaptic('medium');

    // Adsgram reward ad required before submitting withdrawal request
    showToast('Watch an ad to complete your withdrawal request...', 'info');
    await showAdsgramRewardAd(async () => {
      // Optimistically deduct withdraw amount from withdrawable and coins immediately!
      setUser((prev) => {
        const deductWithdrawable = Math.min(prev?.withdrawableBalance || 0, amount);
        const remInr = amount - deductWithdrawable;
        const deductPts = Math.round(remInr * 1000);
        return {
          ...prev,
          withdrawableBalance: Math.max(0, (prev?.withdrawableBalance || 0) - deductWithdrawable),
          coins: Math.max(0, (prev?.coins || 0) - deductPts),
        };
      });

      try {
        const res = await withdrawMutation.mutateAsync({ upiId: finalUpi, amountInr: amount });
        if (res?.user) {
          setUser(res.user);
        }
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setShowWithdrawModal(false);
      } catch (err) {
        // Revert on error
        refreshUser();
      }
    });
  };

  // 1-day recent activities list
  const oneDayAgoMs = Date.now() - 24 * 60 * 60 * 1000;
  const rawActivities = recentActivitiesData?.activities || walletSummary?.recentTransactions || [];
  const oneDayActivities = rawActivities.filter((a) => {
    if (!a.createdAt) return true;
    return new Date(a.createdAt).getTime() >= oneDayAgoMs;
  });

  const displayActivities = rawActivities.length > 0 ? rawActivities.slice(0, 5) : [
    {
      _id: 'default-1',
      title: 'Asteroid Blaster',
      time: 'Today',
      amountText: '+78 PTS',
      isPts: true,
      icon: Gamepad2,
    },
    {
      _id: 'default-2',
      title: 'Mini Racing',
      time: 'Today',
      amountText: '+150 PTS',
      isPts: true,
      icon: Gamepad2,
    },
    {
      _id: 'default-3',
      title: 'Daily Streak Bonus',
      time: '1d ago',
      amountText: '+100 PTS',
      isPts: true,
      icon: Sparkles,
    },
    {
      _id: 'default-4',
      title: 'Asteroid Blaster',
      time: '2d ago',
      amountText: '+38 PTS',
      isPts: true,
      icon: Gamepad2,
    },
  ];

  const getActivityIcon = (type) => {
    if (type === 'withdrawal') return ArrowDownToLine;
    if (type === 'tournament_reward' || type === 'tournament_win') return Trophy;
    if (type === 'daily_checkin' || type === 'daily_streak') return Sparkles;
    if (type === 'task_reward') return CheckCircle2;
    return Gamepad2;
  };

  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      {/* 1. TOP SINGLE UNIFIED BALANCE CARD (Permanent Dark Obsidian) */}
      <div className="wallet-card-permanent-dark rounded-[28px] p-5 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
          <span className="text-[11px] uppercase font-mono text-neutral-400 font-bold tracking-wider">
            WALLET BALANCE
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono text-neutral-300">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>1000 PTS = ₹1.00</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Points */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Coins className="w-3 h-3" />
              </div>
              <span className="text-[11px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                Points
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              <AnimatedCountUp end={coins} duration={1.2} separator="," preserveValue />
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Total Points</span>
          </div>

          {/* Withdrawable */}
          <div className="border-l border-white/10 pl-4 sm:pl-5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                ₹
              </div>
              <span className="text-[11px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                Withdrawable
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              <AnimatedCountUp end={totalInr} decimals={2} duration={1.2} prefix="₹" preserveValue />
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Ready in INR</span>
          </div>
        </div>
      </div>

      {/* 2. ACTION BUTTONS ROW (3 Square Cards matching reference image) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Button 1: History */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            refetchPayoutHistory();
            setShowPayoutHistoryModal(true);
          }}
          className="glass-card rounded-2xl p-3.5 flex flex-col items-center justify-center text-center border border-neutral-200 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 active:scale-95 transition-all shadow-sm group"
        >
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-900 dark:text-white mb-2 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            History
          </span>
        </button>

        {/* Button 2: Withdraw (Prominent Dark Button matching reference) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setShowWithdrawModal(true);
          }}
          className="rounded-2xl p-3.5 flex flex-col items-center justify-center text-center bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white active:scale-95 transition-all shadow-md group"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 dark:bg-black/10 flex items-center justify-center text-white dark:text-black mb-2 group-hover:scale-105 transition-transform">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <span className="text-xs font-black">
            Withdraw
          </span>
        </button>

        {/* Button 3: Payout UPI (Saved UPI) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setNewUpiInput(user?.savedUpiId || upiId || '');
            setShowEditUpiModal(true);
          }}
          className="glass-card rounded-2xl p-3.5 flex flex-col items-center justify-center text-center border border-neutral-200 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 active:scale-95 transition-all shadow-sm group"
        >
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-900 dark:text-white mb-2 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-neutral-900 dark:text-white">
            Payout UPI
          </span>
        </button>
      </div>

      {/* 3. CONVERSION RATE & MINIMUM WITHDRAW PILL (1000 PTS = ₹1.00) */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between text-xs font-mono transition-colors">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">1000 PTS = ₹1.00</span>
        </div>
        <span className="text-neutral-500 dark:text-neutral-400 font-semibold">
          Min. withdraw ₹{minWithdraw}
        </span>
      </div>

      {/* 4. RECENT ACTIVITY SECTION (Matching Reference Image) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-black text-neutral-900 dark:text-white tracking-tight">
            Recent activity
          </h3>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              refetchRecentActivities();
              setShowRecentActivitiesModal(true);
            }}
            className="text-xs font-semibold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-0.5 transition-colors"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Activity Items List */}
        <div className="glass-card rounded-3xl p-2 divide-y divide-neutral-100 dark:divide-white/5 border border-neutral-200 dark:border-white/10">
          {displayActivities.map((act) => {
            const isServer = !!act.createdAt;
            const title = isServer
              ? act.description || (act.type === 'withdrawal' ? 'UPI Withdrawal' : 'Game Reward')
              : act.title;
            const time = isServer ? formatTimeAgo(act.createdAt) : act.time;
            const amountText = isServer
              ? act.type === 'withdrawal'
                ? `-₹${Number(act.amount).toFixed(2)}`
                : `+${formatPoints(act.amount)} PTS`
              : act.amountText;
            const isPositive = !amountText.startsWith('-');
            const Icon = act.icon || getActivityIcon(act.type);

            return (
              <div
                key={act._id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                      {title}
                    </h4>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {time}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-black font-mono ${
                      isPositive ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {amountText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. VERIFIED PAYOUT PROOFS CARD (Matching Bottom of Reference Image) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          if (window.Telegram?.WebApp?.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink('https://t.me/FireflyPayouts');
          } else {
            window.open('https://t.me/FireflyPayouts', '_blank');
          }
        }}
        className="glass-card rounded-2xl p-4 flex items-center justify-between border border-neutral-200 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all cursor-pointer active:scale-[0.99] shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-neutral-900 dark:text-white block leading-tight">
              Payout proofs
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
              Totals and the latest payouts
            </span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </div>

      {/* ================= MODALS ================= */}

      {/* RECENT ACTIVITIES MODAL (LAST 1 DAY / 24 HOURS) */}
      {showRecentActivitiesModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-t-[36px] sm:rounded-3xl bg-white dark:bg-[#121216] border-t sm:border border-neutral-200 dark:border-white/10 p-5 pb-8 text-neutral-900 dark:text-white shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-900 dark:text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Recent Activity</h3>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    Last 24 Hours (1 Day)
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowRecentActivitiesModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 my-3 pr-1 flex-1">
              {loadingActivities && (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="h-16 rounded-2xl bg-neutral-100 dark:bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {!loadingActivities && oneDayActivities.length === 0 && (
                <div className="text-center py-12 text-neutral-400">
                  <Clock className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2.5" />
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    No Activity in the Last 24 Hours
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                    Play games in Arena or finish tasks to start earning PTS!
                  </p>
                </div>
              )}

              {oneDayActivities.map((act) => {
                const Icon = getActivityIcon(act.type);
                const isPositive = act.type !== 'withdrawal' && act.type !== 'tournament_entry';
                const formattedAmt = act.type === 'withdrawal'
                  ? `-₹${Number(act.amount).toFixed(2)}`
                  : `${isPositive ? '+' : '-'}${formatPoints(act.amount)} PTS`;

                return (
                  <div
                    key={act._id}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                          {act.description || (act.type === 'withdrawal' ? 'UPI Withdrawal' : 'Game Earning')}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {act.createdAt ? formatTimeAgo(act.createdAt) : 'Today'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black font-mono ${
                          isPositive ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {formattedAmt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowRecentActivitiesModal(false)}
              className="w-full py-3 rounded-2xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 font-bold text-xs text-neutral-900 dark:text-white transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-t-[36px] sm:rounded-3xl bg-white dark:bg-[#121216] border-t sm:border border-neutral-200 dark:border-white/10 p-6 pb-8 text-neutral-900 dark:text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/5">
              <div>
                <h3 className="text-lg font-black tracking-tight">Withdraw to UPI</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enter your UPI ID and requested withdrawal amount.
                </p>
              </div>

              <button
                onClick={() => setShowWithdrawModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold block mb-1.5">
                  UPI ID (Receive Reward Directly)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mobile@okhdfcbank or user@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 px-4 py-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white/30 font-mono"
                  required
                />
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                  Reward is sent directly to this UPI address after verification by Admin.
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold">
                    Amount to Withdraw (INR)
                  </label>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    Available: {formatINR(totalInr)}
                  </span>
                </div>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 px-4 py-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white/30 font-mono text-lg font-black"
                  required
                />
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                  Minimum withdrawal is ₹5 (equivalent to 5,000 PTS).
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  className="w-full btn-primary-white py-3.5 rounded-2xl text-xs font-black shadow-lg"
                >
                  {withdrawMutation.isPending ? 'Submitting Request...' : 'Submit Request via UPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT UPI MODAL */}
      {showEditUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-5 text-neutral-900 dark:text-white shadow-2xl relative">
            <button
              onClick={() => setShowEditUpiModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-black">Set Saved UPI ID</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              This UPI ID will be used automatically when requesting payouts.
            </p>

            <form onSubmit={handleSaveUpi} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Enter your UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
                  value={newUpiInput}
                  onChange={(e) => setNewUpiInput(e.target.value)}
                  className="w-full rounded-2xl bg-neutral-100 dark:bg-black/50 border border-neutral-200 dark:border-white/10 px-3.5 py-3 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-white/30"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingUpi}
                className="w-full py-3 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-md"
              >
                {savingUpi ? 'Saving...' : 'Save UPI ID'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT HISTORY MODAL (LATEST 10 WITHDRAWALS) */}
      {showPayoutHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-t-[36px] sm:rounded-3xl bg-white dark:bg-[#121216] border-t sm:border border-neutral-200 dark:border-white/10 p-5 pb-8 text-neutral-900 dark:text-white shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-900 dark:text-white">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black">Payout History</h3>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                    Latest 10 Withdrawal Requests
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPayoutHistoryModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 my-3 pr-1 flex-1">
              {loadingPayouts && (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-2xl bg-neutral-100 dark:bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {!loadingPayouts && payoutHistoryList.length === 0 && (
                <div className="text-center py-10 text-neutral-400">
                  <CreditCard className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-xs font-bold">No Payout Requests Yet</p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Withdraw PTS directly to your UPI!
                  </p>
                </div>
              )}

              {payoutHistoryList.map((w) => {
                const isSuccess = w.status === 'completed';
                const isPending = w.status === 'pending';
                const isRejected = w.status === 'rejected';

                return (
                  <div
                    key={w._id}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-neutral-900 dark:text-white">
                          ₹{Number(w.amountInr).toFixed(2)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isSuccess ? '● Transferred' : isPending ? '⏳ In Review' : '✕ Refunded'}
                        </span>
                      </div>

                      <span className="text-[10px] text-neutral-400 font-mono">
                        {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      <span>UPI: {w.upiId}</span>
                      {w.pointsDeducted > 0 && (
                        <span>-{w.pointsDeducted} PTS</span>
                      )}
                    </div>

                    {w.transactionRef && (
                      <div className="text-[10px] font-mono bg-neutral-100 dark:bg-white/5 px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate">
                        Ref: {w.transactionRef}
                      </div>
                    )}

                    {w.rejectionReason && (
                      <div className="text-[10px] font-mono text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
                        {w.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowPayoutHistoryModal(false)}
              className="w-full py-3 rounded-2xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 font-bold text-xs text-neutral-900 dark:text-white transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
