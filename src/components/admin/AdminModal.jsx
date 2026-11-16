import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { triggerHaptic } from '../../services/telegram';
import {
  X,
  ShieldCheck,
  CreditCard,
  Ticket,
  Sliders,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatINR, formatPoints, formatISTDateTime } from '../../utils/formatters';

export default function AdminModal({ isOpen, onClose }) {
  const { showToast } = useGame();
  const [activeAdminTab, setActiveAdminTab] = useState('withdrawals');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState(null);

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawFilter, setWithdrawFilter] = useState('pending');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Promo Codes state
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoRewardInput, setPromoRewardInput] = useState('200');
  const [promoMaxUsersInput, setPromoMaxUsersInput] = useState('50');
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Categories toggle state
  const [categories, setCategories] = useState({
    daily: true,
    social: true,
    partner: true,
    app_tasks: true,
    exclusive: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadOverview();
      loadWithdrawals();
      loadPromoCodes();
    }
  }, [isOpen]);

  async function loadOverview() {
    try {
      const res = await api.getAdminOverview();
      if (res.success) {
        setStats(res.stats);
        if (res.categories) {
          setCategories(res.categories);
        }
      }
    } catch (err) {
      console.warn('Overview load error:', err);
    }
  }

  async function loadWithdrawals(status = withdrawFilter) {
    try {
      setLoading(true);
      const res = await api.getAdminWithdrawals(status);
      if (res.success) {
        setWithdrawals(res.withdrawals || []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadPromoCodes() {
    try {
      const res = await api.getAdminPromoCodes();
      if (res.success) {
        setPromoCodes(res.promoCodes || []);
      }
    } catch (err) {
      console.warn('Promo codes load error:', err);
    }
  }

  // Handle Approve Withdrawal
  const handleApprove = async (withdrawalId) => {
    try {
      setActionLoadingId(withdrawalId);
      triggerHaptic('medium');
      const res = await api.approveWithdrawal(withdrawalId);
      if (res.success) {
        showToast(res.message, 'success');
        loadWithdrawals(withdrawFilter);
        loadOverview();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Withdrawal (with refund)
  const handleReject = async (withdrawalId) => {
    const reason = window.prompt('Enter rejection reason (User will be refunded):', 'Invalid UPI details');
    if (reason === null) return; // Cancelled

    try {
      setActionLoadingId(withdrawalId);
      triggerHaptic('medium');
      const res = await api.rejectWithdrawal(withdrawalId, reason);
      if (res.success) {
        showToast(res.message, 'success');
        loadWithdrawals(withdrawFilter);
        loadOverview();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Create Promo Code
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    try {
      setCreatingPromo(true);
      triggerHaptic('medium');
      const res = await api.createAdminPromoCode({
        code: promoCodeInput.trim(),
        rewardPoints: parseInt(promoRewardInput),
        maxUsers: parseInt(promoMaxUsersInput),
      });

      if (res.success) {
        showToast(res.message, 'success');
        setPromoCodeInput('');
        loadPromoCodes();
        loadOverview();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreatingPromo(false);
    }
  };

  // Handle Delete / Deactivate Promo Code
  const handleDeletePromo = async (promoId) => {
    try {
      triggerHaptic('light');
      const res = await api.deleteAdminPromoCode(promoId);
      if (res.success) {
        showToast(res.message, 'info');
        loadPromoCodes();
        loadOverview();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Toggle Category
  const handleToggleCategory = async (categoryKey) => {
    const currentVal = Boolean(categories[categoryKey]);
    const newVal = !currentVal;

    // Optimistic UI update
    setCategories((prev) => ({ ...prev, [categoryKey]: newVal }));
    triggerHaptic('medium');

    try {
      const res = await api.updateAdminCategory(categoryKey, newVal);
      if (res.success) {
        showToast(`Category '${categoryKey}' is now ${newVal ? 'ON' : 'OFF'}`, 'success');
      }
    } catch (err) {
      // Revert on error
      setCategories((prev) => ({ ...prev, [categoryKey]: currentVal }));
      showToast(err.message, 'error');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerHaptic('light');
    showToast('UPI ID copied!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const categoryMeta = [
    { key: 'app_tasks', label: 'App Tasks', desc: 'Mini apps, partner TMA levels & downloads' },
    { key: 'daily', label: 'Daily Tasks', desc: 'Daily check-in and daily sponsor video tasks' },
    { key: 'social', label: 'Social Tasks', desc: 'Telegram channels and community chat joins' },
    { key: 'partner', label: 'Partner Tasks', desc: 'Sponsored partner visit & airdrop quests' },
    { key: 'exclusive', label: 'Exclusive Tasks', desc: 'Twitter / X follow and special missions' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-t-[36px] sm:rounded-[36px] bg-white dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-5 pb-8 text-neutral-900 dark:text-white shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Top Handle */}
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-white/20 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>Fire Fly Play</span>
                <span className="text-[10px] uppercase font-mono bg-red-500 text-white px-1.5 py-0.5 rounded-md font-bold">
                  ADMIN
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">@Gaurav_281 Control Center</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 my-3.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 shrink-0">
          <button
            onClick={() => setActiveAdminTab('withdrawals')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'withdrawals'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Withdrawals</span>
            {stats?.pendingWithdrawals > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black">
                {stats.pendingWithdrawals}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('promos')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'promos'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Promo Codes</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('categories')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeAdminTab === 'categories'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>

        {/* TAB 1: WITHDRAWALS */}
        {activeAdminTab === 'withdrawals' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 pb-1">
              {['pending', 'completed', 'rejected', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setWithdrawFilter(filter);
                    loadWithdrawals(filter);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                    withdrawFilter === filter
                      ? 'bg-neutral-800 text-white dark:bg-white/20'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}

              <button
                onClick={() => loadWithdrawals(withdrawFilter)}
                className="ml-auto p-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:text-black dark:hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            {withdrawals.length === 0 && !loading && (
              <div className="text-center py-12 text-neutral-400 text-xs font-medium">
                No {withdrawFilter !== 'all' ? withdrawFilter : ''} withdrawal requests found.
              </div>
            )}

            {withdrawals.map((w) => {
              const u = w.userId || {};
              const isPending = w.status === 'pending';
              const isCompleted = w.status === 'completed';

              return (
                <div
                  key={w._id}
                  className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/10 p-3.5 space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neutral-900 dark:text-white">
                          {u.firstName || 'Player'}
                        </span>
                        {u.username && (
                          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                            @{u.username}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 block mt-0.5">
                        TG ID: {u.telegramId || '—'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-neutral-900 dark:text-white font-mono block">
                        ₹{w.amountInr}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          isCompleted
                            ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  </div>

                  {/* UPI Box */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/5">
                    <div className="flex items-center gap-1.5 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white truncate">
                        {w.upiId}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(w.upiId, w._id)}
                      className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 shrink-0 ml-2"
                      title="Copy UPI"
                    >
                      {copiedId === w._id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Rejection Note if rejected */}
                  {w.rejectionReason && (
                    <p className="text-[10px] text-red-500 font-mono">
                      Reason: {w.rejectionReason}
                    </p>
                  )}

                  {/* Time & Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {formatISTDateTime(w.createdAt)}
                    </span>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(w._id)}
                          disabled={actionLoadingId === w._id}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => handleApprove(w._id)}
                          disabled={actionLoadingId === w._id}
                          className="px-4 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 active:scale-95 transition-all shadow-md"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: PROMO CODES */}
        {activeAdminTab === 'promos' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Create Code Form */}
            <form onSubmit={handleCreatePromo} className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/10 p-3.5 space-y-3">
              <span className="text-xs font-black text-neutral-900 dark:text-white block">
                Create New Promo Code
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FIREFLY100"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="w-full rounded-xl bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 px-2.5 py-2 text-xs font-mono font-bold text-neutral-900 dark:text-white uppercase focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">PTS Reward</label>
                  <input
                    type="number"
                    min="1"
                    value={promoRewardInput}
                    onChange={(e) => setPromoRewardInput(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 px-2.5 py-2 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono text-neutral-500 block mb-1">Max Users</label>
                  <input
                    type="number"
                    min="1"
                    value={promoMaxUsersInput}
                    onChange={(e) => setPromoMaxUsersInput(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-black/50 border border-neutral-300 dark:border-white/10 px-2.5 py-2 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingPromo}
                className="w-full btn-primary-white py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{creatingPromo ? 'Creating Code...' : 'Create Promo Code'}</span>
              </button>
            </form>

            {/* Existing Promo Codes List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-500 uppercase font-mono tracking-wider block">
                Active Codes ({promoCodes.length})
              </span>

              {promoCodes.map((p) => {
                const isFull = p.usedCount >= p.maxUsers;
                return (
                  <div
                    key={p._id}
                    className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/10 p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-mono tracking-tight text-neutral-900 dark:text-white">
                          {p.code}
                        </span>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5">
                          +{formatPoints(p.rewardPoints)} PTS
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5 block">
                        Redeemed: {p.usedCount} / {p.maxUsers} users {isFull ? '(LIMIT REACHED)' : ''}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeletePromo(p._id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
                      title={p.isActive ? 'Deactivate Code' : 'Delete Code'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {promoCodes.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-xs">
                  No promo codes created yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES ON / OFF */}
        {activeAdminTab === 'categories' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3 border border-neutral-200 dark:border-white/10">
              <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                Category Visibility Controls
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                Turn a category OFF to instantly hide its tasks and its category button from all users.
              </span>
            </div>

            <div className="space-y-2.5">
              {categoryMeta.map((item) => {
                const isEnabled = categories[item.key] !== false;

                return (
                  <div
                    key={item.key}
                    className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-white/10 p-3.5 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-neutral-900 dark:text-white">
                          {item.label}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                            isEnabled
                              ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {isEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 block">
                        {item.desc}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleCategory(item.key)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        isEnabled ? 'bg-black dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
                      }`}
                    >
                      <span
                        className={`block h-4 w-4 rounded-full transition-transform ${
                          isEnabled
                            ? 'translate-x-6 bg-white dark:bg-black'
                            : 'translate-x-1 bg-white dark:bg-neutral-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
