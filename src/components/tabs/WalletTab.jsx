import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import {
  Wallet,
  ArrowUpRight,
  ArrowRightLeft,
  X,
  CreditCard,
  Coins,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatINR, formatPoints, formatISTTime } from '../../utils/formatters';

export default function WalletTab() {
  const { user, setUser, showToast } = useGame();
  const [walletSummary, setWalletSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [pointsToConvert, setPointsToConvert] = useState('1000');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    try {
      setLoading(true);
      const res = await api.getWalletSummary();
      if (res.success) {
        setWalletSummary(res);
        if (res.savedUpiId) {
          setUpiId(res.savedUpiId);
        }
      }
    } catch (err) {
      console.warn('Wallet summary load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Convert Points to Withdrawable INR (Even 1 PTS allowed: 1000 PTS = 1 INR)
  const handleConvertPoints = async (e) => {
    e.preventDefault();
    const pts = parseInt(pointsToConvert);
    if (!pts || pts < 1) {
      showToast('Please enter at least 1 PTS to convert', 'warning');
      return;
    }
    if ((user?.coins || 0) < pts) {
      showToast('Insufficient PTS balance', 'error');
      return;
    }

    try {
      setSubmitting(true);
      triggerHaptic('medium');
      const res = await api.convertPoints(pts);
      if (res.success && res.user) {
        setUser(res.user);
        sound.playPowerup();
        showToast(res.message, 'success');
        setShowConvertModal(false);
        loadWallet();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Withdrawal Request (with UPI ID)
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!upiId.trim() || !upiId.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm)', 'error');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50) {
      showToast('Minimum withdrawal is ₹50', 'warning');
      return;
    }

    if ((user?.withdrawableBalance || 0) < amount) {
      showToast('Insufficient withdrawable balance. Please convert PTS first.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      triggerHaptic('medium');
      const res = await api.submitWithdrawal(upiId.trim(), amount);
      if (res.success && res.user) {
        setUser(res.user);
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        showToast(res.message, 'success');
        setShowWithdrawModal(false);
        loadWallet();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const coins = user?.coins || 0;
  const withdrawable = user?.withdrawableBalance || 0;
  // 1000 PTS = 1 INR
  const totalInr = coins / 1000 + withdrawable;
  const minWithdraw = walletSummary?.minWithdrawInr || 50;

  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      {/* 1. TOTAL VALUE CARD */}
      <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors">
        <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 font-semibold tracking-wider block mb-1">
          Total Value
        </span>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
            {formatINR(totalInr)}
          </span>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          Points at live rate, plus balance ready to withdraw
        </p>

        {/* Sub Cards: POINTS & WITHDRAWABLE */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3.5 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              Points
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
              Withdrawable
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-green-500 font-mono">
                {formatINR(withdrawable)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Convert & Withdraw */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setShowConvertModal(true);
            }}
            className="btn-secondary-dark py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Convert</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('selection');
              setShowWithdrawModal(true);
            }}
            className="btn-primary-white py-3 rounded-2xl text-xs flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw</span>
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

      {/* 3. Saved UPI ID Card */}
      {user?.savedUpiId && (
        <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between border border-neutral-200 dark:border-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Saved UPI ID</span>
              <span className="text-xs font-semibold text-neutral-900 dark:text-white font-mono">{user.savedUpiId}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setUpiId(user.savedUpiId);
              setShowWithdrawModal(true);
            }}
            className="text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white"
          >
            Use
          </button>
        </div>
      )}

      {/* 4. Recent Activity */}
      <div className="glass-card rounded-3xl p-5 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Recent activity</h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">IST</span>
        </div>

        <div className="space-y-2">
          {walletSummary?.recentTransactions?.map((tx, idx) => {
            const isPositive = tx.amount > 0;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100 dark:bg-[#141418] border border-neutral-200 dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/5 text-neutral-700 dark:text-neutral-300">
                    {tx.type === 'game_reward' ? '🎮' : tx.type === 'convert' ? '🔄' : tx.type === 'withdrawal' ? '💸' : '🎁'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">{tx.description}</p>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {formatISTTime(tx.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isPositive ? 'text-green-500' : 'text-rose-500'
                    }`}
                  >
                    {isPositive ? `+${formatPoints(tx.amount)}` : formatPoints(tx.amount)} {tx.currency || 'PTS'}
                  </span>
                </div>
              </div>
            );
          })}

          {(!walletSummary?.recentTransactions || walletSummary.recentTransactions.length === 0) && (
            <p className="text-center text-xs text-neutral-400 py-4">No recent activity yet.</p>
          )}
        </div>
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
                    Avail: {formatINR(withdrawable)}
                  </span>
                </div>
                <input
                  type="number"
                  min="50"
                  step="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 px-4 py-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white/30 font-mono text-lg font-black"
                  required
                />
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 block">
                  Minimum withdrawal is ₹50.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary-white py-3.5 rounded-2xl text-xs font-black shadow-lg"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Request via UPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT MODAL (Matching Reference Image: media_1794850012766_be5152f3.jpg) */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-fade-in">
          <div className="w-full max-w-md rounded-t-[36px] bg-white dark:bg-[#121216] border-t border-x border-neutral-200 dark:border-white/10 p-5 pb-8 text-neutral-900 dark:text-white shadow-2xl relative transition-colors max-h-[90vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-white/20" />

            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
              <h3 className="text-base font-black text-neutral-900 dark:text-white tracking-tight">Convert points</h3>
              <button
                onClick={() => setShowConvertModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertPoints} className="space-y-3 pt-4">
              {/* Card 1: You convert */}
              <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/10 p-3.5">
                <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1.5">
                  <span>You convert</span>
                  <span className="font-mono">Balance {formatPoints(coins)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={coins}
                      value={pointsToConvert}
                      onChange={(e) => setPointsToConvert(e.target.value)}
                      className="w-full bg-transparent text-2xl font-black text-neutral-900 dark:text-white font-mono focus:outline-none"
                      required
                    />
                  </div>
                  <span className="rounded-xl border border-neutral-300 dark:border-white/15 px-3 py-1 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    PTS
                  </span>
                </div>
              </div>

              {/* Center Down Arrow Circle */}
              <div className="flex justify-center -my-2 relative z-10">
                <div className="h-8 w-8 rounded-full bg-white dark:bg-[#1a1a22] border border-neutral-200 dark:border-white/15 flex items-center justify-center shadow-md text-neutral-700 dark:text-neutral-300">
                  <ArrowRightLeft className="w-4 h-4 rotate-90" />
                </div>
              </div>

              {/* Card 2: You get */}
              <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/10 p-3.5">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1.5">
                  You get
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-neutral-600 dark:text-neutral-400">₹</span>
                    <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
                      {((Math.max(0, parseInt(pointsToConvert || 0)) / 1000) >= 1)
                        ? (Math.max(0, parseInt(pointsToConvert || 0)) / 1000).toFixed(2)
                        : (Math.max(0, parseInt(pointsToConvert || 0)) / 1000).toFixed(3)}
                    </span>
                  </div>
                  <span className="rounded-xl border border-neutral-300 dark:border-white/15 px-3 py-1 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    INR
                  </span>
                </div>
              </div>

              {/* Percentage Selection Pills (25%, 50%, 75%, Max) */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const label = pct === 1 ? 'Max' : `${pct * 100}%`;
                  const calcPts = Math.floor(coins * pct);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPointsToConvert(calcPts.toString())}
                      className="py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 active:scale-95 transition-all font-mono"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="text-center text-[11px] text-neutral-500 dark:text-neutral-400 font-mono py-1">
                Rate: 1,000 PTS = ₹1.00 INR (1 PTS = ₹0.001) • Minimum: 1 PTS
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting || coins < 1 || parseInt(pointsToConvert || 0) < 1}
                  className="w-full btn-primary-white py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all"
                >
                  {submitting ? 'Converting...' : 'Convert to INR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
