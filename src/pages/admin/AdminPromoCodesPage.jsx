import React, { useState } from 'react';
import {
  useAdminPromoCodesQuery,
  useAdminCreatePromoMutation,
} from '../../hooks/queries';
import { triggerHaptic } from '../../services/telegram';
import { Plus, Ticket, Copy, Check, Users } from 'lucide-react';

export default function AdminPromoCodesPage() {
  const [code, setCode] = useState('');
  const [rewardPoints, setRewardPoints] = useState('200');
  const [maxUsers, setMaxUsers] = useState('50');
  const [copiedCode, setCopiedCode] = useState(null);

  const { data, isLoading } = useAdminPromoCodesQuery();
  const createMutation = useAdminCreatePromoMutation();

  const promoCodes = data?.promoCodes || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    triggerHaptic('medium');
    await createMutation.mutateAsync({
      code: code.trim().toUpperCase(),
      rewardPoints: parseInt(rewardPoints) || 100,
      maxUsers: parseInt(maxUsers) || 50,
    });

    setCode('');
    setRewardPoints('200');
    setMaxUsers('50');
  };

  const handleCopy = (c) => {
    navigator.clipboard.writeText(c);
    triggerHaptic('success');
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1. CREATE PROMO CODE CARD */}
      <div className="rounded-3xl bg-[#14141c] border border-white/10 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="w-5 h-5 text-green-400" />
          <h2 className="text-sm font-bold text-white">Create New Promo Code</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Promo Code</label>
              <input
                type="text"
                placeholder="e.g. FIREFLY500"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono uppercase focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Reward (PTS)</label>
              <input
                type="number"
                min="10"
                step="10"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-white/30"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Max Redemptions</label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-white/30"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{createMutation.isPending ? 'Generating Code...' : 'Create Promo Code'}</span>
          </button>
        </form>
      </div>

      {/* 2. PROMO CODES LIST */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-1 font-mono">
          Active & Generated Promo Codes ({promoCodes.length})
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-neutral-500 font-mono text-xs animate-pulse">
            Loading promo codes...
          </div>
        ) : promoCodes.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-[#14141c] border border-white/5 text-neutral-500 text-xs">
            No promo codes created yet. Create one above to reward players!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promoCodes.map((p) => {
              const pct = Math.min(100, Math.round(((p.usedCount || 0) / (p.maxUsers || 1)) * 100));
              const isFull = (p.usedCount || 0) >= (p.maxUsers || 1);

              return (
                <div
                  key={p._id}
                  className="rounded-3xl bg-[#14141c] border border-white/5 p-4 flex flex-col justify-between hover:border-white/15 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono tracking-wider text-white select-all">
                        {p.code}
                      </span>
                      <button
                        onClick={() => handleCopy(p.code)}
                        className="h-6 w-6 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center active:scale-95 transition-all"
                        title="Copy code"
                      >
                        {copiedCode === p.code ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                      +{p.rewardPoints} PTS
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-1.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Redeemed: {p.usedCount || 0} / {p.maxUsers}
                      </span>
                      <span className={isFull ? 'text-red-400 font-bold' : ''}>
                        {isFull ? 'FULLY REDEEMED' : `${pct}%`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
