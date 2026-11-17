import React, { useState } from 'react';
import {
  useAdminWithdrawalsQuery,
  useAdminApproveWithdrawalMutation,
  useAdminRejectWithdrawalMutation,
} from '../../hooks/queries';
import { formatINR, formatISTDateTime } from '../../utils/formatters';
import { triggerHaptic } from '../../services/telegram';
import { CheckCircle2, XCircle, Copy, Check, Clock, AlertCircle } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [filter, setFilter] = useState('pending');
  const [copiedId, setCopiedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch } = useAdminWithdrawalsQuery(filter);
  const approveMutation = useAdminApproveWithdrawalMutation();
  const rejectMutation = useAdminRejectWithdrawalMutation();

  const withdrawals = data?.withdrawals || [];

  const handleCopyUPI = (upi, id) => {
    navigator.clipboard.writeText(upi);
    triggerHaptic('success');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (id) => {
    triggerHaptic('medium');
    await approveMutation.mutateAsync(id);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId) return;
    triggerHaptic('warning');
    await rejectMutation.mutateAsync({
      id: rejectingId,
      reason: rejectReason.trim() || 'Rejected by Admin. Amount refunded.',
    });
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* FILTER TABS */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-[#14141c] p-1 rounded-2xl border border-white/5">
          {['pending', 'completed', 'rejected', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => {
                triggerHaptic('selection');
                setFilter(st);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                filter === st
                  ? 'bg-white text-black shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-neutral-400">
          Total: {withdrawals.length}
        </span>
      </div>

      {/* WITHDRAWALS LIST */}
      {isLoading ? (
        <div className="p-12 text-center text-neutral-500 font-mono text-xs animate-pulse">
          Loading withdrawal requests...
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#14141c] border border-white/5 text-neutral-500 text-sm">
          No {filter} withdrawal requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => {
            const isPending = w.status === 'pending';
            const userObj = w.userId || {};

            return (
              <div
                key={w._id}
                className="rounded-3xl bg-[#14141c] border border-white/5 p-4 transition-all hover:border-white/15"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  {/* User info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {userObj.firstName || 'Player'}
                      </span>
                      {userObj.username && (
                        <span className="text-xs text-neutral-400">@{userObj.username}</span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                          w.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : w.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      TG ID: {userObj.telegramId || 'N/A'} • {formatISTDateTime(w.createdAt)}
                    </div>
                  </div>

                  {/* Payout amount */}
                  <div className="text-left sm:text-right">
                    <span className="text-xl font-black font-mono text-green-400">
                      {formatINR(w.amountInr)}
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-mono">
                      ({(w.pointsDeducted || w.amountInr * 1000).toLocaleString('en-IN')} PTS)
                    </span>
                  </div>
                </div>

                {/* UPI Address Box */}
                <div className="flex items-center justify-between bg-black/40 rounded-2xl p-2.5 border border-white/5 mb-3">
                  <div className="flex items-center gap-2 font-mono text-xs text-neutral-200 truncate mr-2">
                    <span className="text-neutral-500 font-sans text-[11px]">UPI:</span>
                    <span className="font-bold select-all">{w.upiId}</span>
                  </div>
                  <button
                    onClick={() => handleCopyUPI(w.upiId, w._id)}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs flex items-center gap-1 font-mono transition-all flex-shrink-0"
                  >
                    {copiedId === w._id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {w.rejectionReason && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2 mb-3">
                    Reason: {w.rejectionReason}
                  </div>
                )}

                {/* Action buttons if Pending */}
                {isPending && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => handleApprove(w._id)}
                      disabled={approveMutation.isPending}
                      className="py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Mark Paid</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        setRejectingId(w._id);
                      }}
                      disabled={rejectMutation.isPending}
                      className="py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject & Refund</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#181822] border border-white/10 p-5 text-white shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base">Reject & Refund Withdrawal</h3>
            </div>
            <p className="text-xs text-neutral-300 mb-3">
              Rejecting this request will automatically refund the full INR amount back to the player's wallet balance.
            </p>
            <input
              type="text"
              placeholder="Reason (e.g. Invalid UPI ID or name mismatch)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-400 mb-4"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="py-2.5 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectMutation.isPending}
                className="py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 active:scale-95 transition-all"
              >
                {rejectMutation.isPending ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
