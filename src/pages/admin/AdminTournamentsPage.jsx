import React, { useState } from 'react';
import {
  useAdminTournamentsQuery,
  useCreateAdminTournamentMutation,
  useDeclareAdminTournamentResultsMutation,
  useDeleteAdminTournamentMutation,
} from '../../hooks/queries';
import { triggerHaptic } from '../../services/telegram';
import {
  Trophy,
  Plus,
  Trash2,
  Clock,
  Users,
  Award,
  CheckCircle,
  Coins,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatPoints } from '../../utils/formatters';

export default function AdminTournamentsPage() {
  const [title, setTitle] = useState('');
  const [entryFee, setEntryFee] = useState('200');
  const [prizePool, setPrizePool] = useState('1000');
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [durationHours, setDurationHours] = useState('24');
  const [winnerCount, setWinnerCount] = useState(3); // 1, 2, or 3
  const [rank1Reward, setRank1Reward] = useState('500');
  const [rank2Reward, setRank2Reward] = useState('300');
  const [rank3Reward, setRank3Reward] = useState('200');
  const [expandedTourneyId, setExpandedTourneyId] = useState(null);

  const { data, isLoading, refetch } = useAdminTournamentsQuery();
  const createMutation = useCreateAdminTournamentMutation();
  const declareResultsMutation = useDeclareAdminTournamentResultsMutation();
  const deleteMutation = useDeleteAdminTournamentMutation();

  const tournaments = data?.tournaments || [];

  // Update rewards auto-split when prize pool or winner count changes
  const handlePrizePoolChange = (newPool) => {
    setPrizePool(newPool);
    const poolNum = parseInt(newPool) || 1000;
    autoSplitRewards(poolNum, winnerCount);
  };

  const handleWinnerCountChange = (count) => {
    setWinnerCount(count);
    const poolNum = parseInt(prizePool) || 1000;
    autoSplitRewards(poolNum, count);
  };

  const autoSplitRewards = (pool, count) => {
    if (count === 1) {
      setRank1Reward(String(pool));
      setRank2Reward('0');
      setRank3Reward('0');
    } else if (count === 2) {
      const r1 = Math.round(pool * 0.7);
      const r2 = pool - r1;
      setRank1Reward(String(r1));
      setRank2Reward(String(r2));
      setRank3Reward('0');
    } else {
      const r1 = Math.round(pool * 0.5);
      const r2 = Math.round(pool * 0.3);
      const r3 = pool - r1 - r2;
      setRank1Reward(String(r1));
      setRank2Reward(String(r2));
      setRank3Reward(String(r3));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    triggerHaptic('medium');

    const rewards = [];
    rewards.push({ rank: 1, reward: parseInt(rank1Reward) || 0 });
    if (winnerCount >= 2) {
      rewards.push({ rank: 2, reward: parseInt(rank2Reward) || 0 });
    }
    if (winnerCount === 3) {
      rewards.push({ rank: 3, reward: parseInt(rank3Reward) || 0 });
    }

    await createMutation.mutateAsync({
      title: title.trim(),
      entryFee: parseInt(entryFee) || 0,
      prizePool: parseInt(prizePool) || 1000,
      maxParticipants: parseInt(maxParticipants) || 50,
      winnerCount,
      rankRewards: rewards,
      durationHours: parseInt(durationHours) || 24,
    });

    setTitle('');
    refetch();
  };

  const handleDeclareResults = (tournament) => {
    if (
      window.confirm(
        `Are you sure you want to declare results for "${tournament.title}"? Prizes will be distributed automatically to the top ${tournament.winnerCount} participants.`
      )
    ) {
      triggerHaptic('warning');
      declareResultsMutation.mutate(tournament._id);
    }
  };

  const handleDelete = (tournament) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${tournament.title}"? Any active entry fees will be refunded to participants.`
      )
    ) {
      triggerHaptic('warning');
      deleteMutation.mutate(tournament._id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CREATE NEW TOURNAMENT CARD */}
      <div className="rounded-3xl bg-[#14141c] border border-white/10 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Create New Tournament</h2>
            <p className="text-[11px] text-neutral-400">Launch a competitive event for your players</p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-3.5">
          {/* Title */}
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Tournament Title</label>
            <input
              type="text"
              placeholder="e.g. Firefly Weekend Blitz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
              required
            />
          </div>

          {/* Grid: Entry Fee, Prize Pool, Total Participants, Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Entry Fee (PTS)</label>
              <input
                type="number"
                placeholder="200"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
                min="0"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Prize Pool (PTS)</label>
              <input
                type="number"
                placeholder="1000"
                value={prizePool}
                onChange={(e) => handlePrizePoolChange(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
                min="10"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Max Participants (X)</label>
              <input
                type="number"
                placeholder="50"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
                min="2"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Ends In (Hours)</label>
              <input
                type="number"
                placeholder="24"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
                min="1"
                required
              />
            </div>
          </div>

          {/* Winner Count Selection: 1, 2, or 3 */}
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1.5">
              Winners: Choose 1, 2, or 3 Rank Winners (Min 1, Max 3)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleWinnerCountChange(count)}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                    winnerCount === count
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-black/30 text-neutral-400 border-white/10 hover:text-white'
                  }`}
                >
                  {count === 1 ? '1 Winner (Rank 1)' : count === 2 ? '2 Winners (Ranks 1 & 2)' : '3 Winners (Ranks 1, 2 & 3)'}
                </button>
              ))}
            </div>
          </div>

          {/* Reward Allocation Inputs for Selected Ranks */}
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-mono text-neutral-400 block">Reward Distribution</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">🥇 Rank 1 Reward (PTS)</label>
                <input
                  type="number"
                  value={rank1Reward}
                  onChange={(e) => setRank1Reward(e.target.value)}
                  className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>

              {winnerCount >= 2 && (
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">🥈 Rank 2 Reward (PTS)</label>
                  <input
                    type="number"
                    value={rank2Reward}
                    onChange={(e) => setRank2Reward(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              )}

              {winnerCount === 3 && (
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">🥉 Rank 3 Reward (PTS)</label>
                  <input
                    type="number"
                    value={rank3Reward}
                    onChange={(e) => setRank3Reward(e.target.value)}
                    className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-95 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>{createMutation.isPending ? 'Launching Tournament...' : 'Launch Tournament'}</span>
          </button>
        </form>
      </div>

      {/* 2. TOURNAMENTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            Active & Past Tournaments ({tournaments.length})
          </h3>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {tournaments.map((t) => {
          const isExpanded = expandedTourneyId === t._id;
          const isEnded = t.status === 'completed' || new Date() > new Date(t.endDate);
          const topParticipants = (t.participants || []).slice(0, 3);

          return (
            <div
              key={t._id}
              className="rounded-3xl bg-[#14141c] border border-white/10 p-5 shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        t.resultsDeclared
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : t.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'
                      }`}
                    >
                      {t.resultsDeclared ? 'Results Declared' : t.status}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Ends: {new Date(t.endDate).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{t.title}</h4>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase text-neutral-400 block">Prize Pool</span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {formatPoints(t.prizePool)} PTS
                  </span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 my-2.5 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[9px] text-neutral-400 block">Entry Fee</span>
                  <span className="text-white font-bold">{t.entryFee} PTS</span>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[9px] text-neutral-400 block">Participants</span>
                  <span className="text-white font-bold">
                    {t.participantCount || (t.participants || []).length} / {t.maxParticipants}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-[9px] text-neutral-400 block">Winners</span>
                  <span className="text-white font-bold">Top {t.winnerCount}</span>
                </div>
              </div>

              {/* Actions: Declare Results & Delete */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                {!t.resultsDeclared && (
                  <button
                    onClick={() => handleDeclareResults(t)}
                    disabled={declareResultsMutation.isPending}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-500/30 active:scale-95 transition-all"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Declare Results & Award</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(t)}
                  disabled={deleteMutation.isPending}
                  className="py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-500/20 active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() =>
                    setExpandedTourneyId(expandedTourneyId === t._id ? null : t._id)
                  }
                  className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 font-bold text-xs flex items-center justify-center gap-1 hover:text-white"
                >
                  <span>Participants ({t.participants?.length || 0})</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded Participants List */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                    All Participants & Scores
                  </span>
                  {(!t.participants || t.participants.length === 0) && (
                    <div className="text-center py-2 text-xs text-neutral-500">
                      No participants registered yet.
                    </div>
                  )}
                  {t.participants?.map((p, idx) => (
                    <div
                      key={p.telegramId || idx}
                      className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400">#{idx + 1}</span>
                        <span className="text-white">
                          {p.firstName || p.username || p.telegramId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400">{p.attempts}/10 tries</span>
                        <span className="font-bold text-emerald-400">{p.bestScore} PTS</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
