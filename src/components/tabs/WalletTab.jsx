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
  useWithdrawMutation,
} from '../../hooks/queries';
import {
  Wallet,
  ArrowUpRight,
  ArrowRightLeft,
  X,
  CreditCard,
  Coins,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Flame,
  CheckCircle2,
  Edit2,
  Clock,
  History,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatINR, formatPoints, formatISTTime, formatISTDateTime } from '../../utils/formatters';

export default function WalletTab() {
  const { user, setUser, showToast } = useGame();
  const { data: walletSummary, isLoading } = useWalletSummaryQuery();
  const { data: payoutHistoryData, isLoading: loadingPayouts, refetch: refetchPayoutHistory } = usePayoutHistoryQuery();
  const withdrawMutation = useWithdrawMutation();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showEditUpiModal, setShowEditUpiModal] = useState(false);
  const [showPayoutHistoryModal, setShowPayoutHistoryModal] = useState(false);
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
      try {
        await withdrawMutation.mutateAsync({ upiId: finalUpi, amountInr: amount });
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setShowWithdrawModal(false);
      } catch (err) {
        // Toast handled by mutation
      }
    });
  };

  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      {/* 1. TOTAL VALUE CARD */}
      <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors">
        <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider block mb-1">
          Withdrawable Balance
        </span>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
            {formatINR(totalInr)}
          </span>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          Live value of your earned PTS directly available for instant UPI withdrawal
        </p>

        {/* Sub Cards: POINTS & VALUE */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3.5 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              Total Points
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-neutral-900 dark:text-white font-mono">
                {formatPoints(coins)}
              </span>
              <span className="text-[10px] text-neutral-400">PTS</span>
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3.5 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              Rate
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-green-500 font-mono">
                1k = ₹1.00
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Withdraw directly */}
        <div className="pt-1">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setShowWithdrawModal(true);
            }}
            className="w-full btn-primary-white py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 font-black shadow-lg uppercase tracking-wider"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw ({formatINR(totalInr)})</span>
          </button>
        </div>
      </div>

      {/* 2. Rate & Minimum Withdraw Pill (1000 PTS = 1 INR) */}
      <div className="glass-card rounded-2xl p-3 flex items-center justify-between text-xs font-mono transition-colors">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-300">
          <span className="flex h-2 w-2 rounded-full bg-green-500" />
          <span>1000 PTS = ₹1.00 INR</span>
        </div>
        <span className="text-neutral-500 dark:text-neutral-400">Min. withdraw ₹{minWithdraw}</span>
      </div>

      {/* Payout History Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          refetchPayoutHistory();
          setShowPayoutHistoryModal(true);
        }}
        className="w-full glass-card rounded-2xl p-3.5 flex items-center justify-between border border-neutral-200 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all active:scale-[0.99] group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white group-hover:scale-105 transition-transform">
            <History className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-neutral-900 dark:text-white block">
              Payout History
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
              View latest 10 withdrawals & transaction proofs
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 group-hover:text-black dark:group-hover:text-white">
          <span>View</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* 3. Saved UPI ID Card (Click to edit & auto-used on withdraw) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setNewUpiInput(user?.savedUpiId || upiId || '');
          setShowEditUpiModal(true);
        }}
        className="glass-card rounded-2xl p-3.5 flex items-center justify-between border border-neutral-200 dark:border-white/5 hover:border-white/20 transition-all cursor-pointer active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">
              Saved UPI ID (Tap to Edit)
            </span>
            <span className="text-xs font-semibold text-neutral-900 dark:text-white font-mono">
              {user?.savedUpiId || 'No UPI ID saved — Tap to add'}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white px-2 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" />
          <span>{user?.savedUpiId ? 'Change' : '+ Add'}</span>
        </button>
      </div>

      {/* 4. VERIFIED PAYOUT PROOFS SECTION (Replaces Recent Activity) */}
      <div className="glass-card rounded-3xl p-5 relative overflow-hidden transition-colors border border-emerald-500/20 shadow-lg">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Verified Payout Proofs</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              </h3>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Public Channel
          </span>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 my-3 leading-relaxed">
          Every single UPI payout sent to our players is published publicly on our official proof channel for complete transparency.
        </p>

        {/* Feature badges */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Instant UPI Transfers</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Payment Screenshots</span>
          </div>
        </div>

        {/* Payout Proof Channel Button */}
        <a
          href="https://t.me/FireflyPayouts"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic('medium')}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
        >
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Open Firefly Payout Proofs Channel</span>
          <ExternalLink className="w-3.5 h-3.5 text-white/80" />
        </a>
      </div>

      {/* WITHDRAW BOTTOM SHEET (Matching Reference Panel) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-fade-in">
          <div className="w-full max-w-md rounded-t-[36px] bg-white dark:bg-[#121216] border-t border-x border-neutral-200 dark:border-white/10 p-5 pb-8 text-neutral-900 dark:text-white shadow-2xl relative transition-colors max-h-[90vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-white/20" />

            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
              <h3 className="text-base font-black text-neutral-900 dark:text-white tracking-tight">Withdraw Funds</h3>
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
                    Convert PTS to withdrawable INR and withdraw directly to your UPI!
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
