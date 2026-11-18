import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { showAdsgramRewardAd } from '../../services/ads';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import { useTasksQuery, useTournamentsQuery, useJoinTournamentMutation } from '../../hooks/queries';
import {
  Trophy,
  Smartphone,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Play,
  Tv,
  Car,
  Rocket,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPoints } from '../../utils/formatters';

export default function TasksTab() {
  const { user, setUser, showToast, refreshUser, launchTournamentMatch } = useGame();
  const { data: tasksData, isLoading: loadingTasks, refetch: refetchTasks } = useTasksQuery();
  const { data: tournamentsData, isLoading: loadingTourneys, refetch: refetchTourneys } = useTournamentsQuery();
  const joinTournamentMutation = useJoinTournamentMutation();

  // Default select category is strictly Tournaments
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('preferred_task_cat') || 'tournaments';
  });

  const [activeTimers, setActiveTimers] = useState({});
  const [localStarted, setLocalStarted] = useState({});
  const [expandedLeaderboards, setExpandedLeaderboards] = useState({});
  const [joiningId, setJoiningId] = useState(null);

  const tasks = tasksData?.tasks || [];
  const tournaments = tournamentsData?.tournaments || [];

  useEffect(() => {
    const pref = sessionStorage.getItem('preferred_task_cat');
    if (pref) {
      setSelectedCategory(pref);
      sessionStorage.removeItem('preferred_task_cat');
    }
  }, []);

  const toggleLeaderboard = (tournamentId) => {
    triggerHaptic('light');
    setExpandedLeaderboards((prev) => ({
      ...prev,
      [tournamentId]: !prev[tournamentId],
    }));
  };

  const handleJoinTournament = async (tournament) => {
    if (!user) return;
    if ((user.coins || 0) < tournament.entryFee) {
      showToast(`Insufficient PTS! Entry fee is ${tournament.entryFee} PTS. You have ${user.coins || 0} PTS.`, 'error');
      return;
    }

    triggerHaptic('medium');
    setJoiningId(tournament._id);

    // Optimistically deduct entry fee immediately so UI updates with ZERO delay!
    setUser((prev) => ({
      ...prev,
      coins: Math.max(0, (prev?.coins || 0) - tournament.entryFee),
    }));

    try {
      const res = await joinTournamentMutation.mutateAsync(tournament._id);
      if (res?.user) {
        setUser(res.user);
      }
      sound.playPowerup();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      refetchTourneys();
    } catch (err) {
      // Revert if error
      refreshUser();
    } finally {
      setJoiningId(null);
    }
  };

  const handlePlayTournamentMatch = async (tournament) => {
    triggerHaptic('medium');
    const userPart = tournament.userParticipation;
    if (!userPart || !userPart.joined) {
      showToast('Please join the tournament first!', 'warning');
      return;
    }

    if (userPart.attempts >= 10) {
      showToast('You have used all 10 tournament attempts!', 'info');
      return;
    }

    // Attempts 2 to 10 require watching an Adsgram ad
    if (userPart.attempts >= 1) {
      showToast('Watch an ad to unlock your next tournament attempt!', 'info');
      await showAdsgramRewardAd(
        async () => {
          sound.playPowerup();
          showToast('Attempt unlocked! You can now play again.', 'success');
          launchTournamentMatch(tournament);
        },
        {
          badgeText: 'TOURNAMENT ATTEMPT UNLOCK',
          title: tournament.title || 'Tournament Attempt',
          description: `Watch this sponsor clip to unlock Attempt ${userPart.attempts + 1} of 10.`,
          buttonText: 'Attempt Unlocked',
        }
      );
      return;
    }

    // First attempt free with entry fee
    launchTournamentMatch(tournament);
  };

  const handleStartTask = async (task) => {
    triggerHaptic('medium');

    if (task.actionType === 'ad_watch') {
      await showAdsgramRewardAd(async () => {
        await claimTaskReward(task._id);
      });
      return;
    }

    if (task.actionUrl) {
      window.open(task.actionUrl, '_blank');
    }

    try {
      const res = await api.startTask(task._id);
      if (res.success) {
        setLocalStarted((prev) => ({ ...prev, [task._id]: true }));
        refetchTasks();

        if (task.delaySeconds > 0) {
          setActiveTimers((prev) => ({ ...prev, [task._id]: task.delaySeconds }));

          let remaining = task.delaySeconds;
          const interval = setInterval(() => {
            remaining -= 1;
            setActiveTimers((prev) => ({ ...prev, [task._id]: remaining }));
            if (remaining <= 0) {
              clearInterval(interval);
            }
          }, 1000);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const claimTaskReward = async (taskId) => {
    try {
      triggerHaptic('success');
      const res = await api.claimTask(taskId);
      if (res.success && res.user) {
        setUser(res.user);
        sound.playPowerup();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        showToast(res.message, 'success');
        refetchTasks();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Only 2 categories: Tournaments and App Tasks
  // Commented out: daily, social, partner, exclusive as requested
  const visibleCategories = [
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'app_tasks', label: 'App Tasks', icon: Smartphone },
    // { id: 'daily', label: 'Daily', icon: Calendar },
    // { id: 'social', label: 'Social', icon: Users },
    // { id: 'partner', label: 'Partner', icon: Handshake },
    // { id: 'exclusive', label: 'Exclusive', icon: Sparkles },
  ];

  const filteredTasks = tasks.filter((t) => t.category === 'app_tasks');

  // Format time remaining helper
  const formatTimeLeft = (endDateStr) => {
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h ${minutes}m left`;
  };

  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      {/* Category Pills: Tournaments & App Tasks only */}
      <div className="grid grid-cols-2 gap-2">
        {visibleCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const badgeCount =
            cat.id === 'tournaments'
              ? tournaments.filter((t) => t.status === 'active').length
              : filteredTasks.filter((t) => t.status !== 'completed').length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('selection');
                setSelectedCategory(cat.id);
              }}
              className={`relative flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg font-bold'
                  : 'bg-white dark:bg-[#141418] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/5 hover:text-black dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-bold">{cat.label}</span>
              {badgeCount > 0 && (
                <span
                  className={`ml-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black ${
                    isSelected
                      ? 'bg-neutral-800 text-white dark:bg-black dark:text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. TOURNAMENTS VIEW */}
      {/* ======================================================== */}
      {selectedCategory === 'tournaments' && (
        <div className="space-y-4">
          {loadingTourneys && (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-56 rounded-3xl bg-neutral-200/50 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {!loadingTourneys && tournaments.length === 0 && (
            <div className="glass-card rounded-3xl p-8 text-center text-neutral-500 dark:text-neutral-400">
              <Trophy className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-500 mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">No Active Tournaments</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Check back shortly! New high-stakes tournaments are hosted regularly.
              </p>
            </div>
          )}

          {tournaments.map((tourney) => {
            const isExpanded = Boolean(expandedLeaderboards[tourney._id]);
            const userPart = tourney.userParticipation;
            const hasJoined = userPart?.joined;
            const isEnded = tourney.status !== 'active';
            const timeLeft = formatTimeLeft(tourney.endDate);

            return (
              <div
                key={tourney._id}
                className="glass-card-elevated rounded-3xl p-5 border border-neutral-200 dark:border-white/10 shadow-xl transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase ${
                          !isEnded
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30'
                            : 'bg-neutral-200 dark:bg-neutral-500/20 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-500/30'
                        }`}
                      >
                        {!isEnded ? '● Live' : 'Completed'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10 flex items-center gap-1">
                        {tourney.gameType === 'car_runner' ? (
                          <>
                            <Car className="w-3 h-3 text-cyan-500" />
                            <span>Mini Racing</span>
                          </>
                        ) : (
                          <>
                            <Rocket className="w-3 h-3 text-amber-500" />
                            <span>Asteroid Blaster</span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeLeft}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-neutral-900 dark:text-white">{tourney.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Prize Pool</span>
                    <div className="flex items-center justify-end gap-1">
                      <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      <span className="text-lg font-black text-amber-500 dark:text-amber-400 font-mono">
                        {formatPoints(tourney.prizePool)}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">PTS</span>
                    </div>
                  </div>
                </div>

                {/* Tournament Stats Pill Grid */}
                <div className="grid grid-cols-3 gap-2 my-3">
                  <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5 border border-neutral-200 dark:border-white/5 text-center">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Entry Fee</span>
                    <span className="text-xs font-black text-neutral-900 dark:text-white font-mono">{tourney.entryFee} PTS</span>
                  </div>

                  <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5 border border-neutral-200 dark:border-white/5 text-center">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Players</span>
                    <span className="text-xs font-black text-neutral-900 dark:text-white font-mono">
                      {tourney.participantCount} / {tourney.maxParticipants || '∞'}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5 border border-neutral-200 dark:border-white/5 text-center">
                    <span className="text-[9px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Winners</span>
                    <span className="text-xs font-black text-neutral-900 dark:text-white font-mono">
                      Top {tourney.winnerCount}
                    </span>
                  </div>
                </div>

                {/* Reward Distribution Badges */}
                <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 p-2.5 mb-3 flex items-center justify-around text-xs font-mono">
                  {tourney.rankRewards?.map((r) => (
                    <div key={r.rank} className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                        {formatPoints(r.reward)} PTS
                      </span>
                    </div>
                  ))}
                </div>

                {/* User Status Card (if joined) */}
                {hasJoined && (
                  <div className="rounded-2xl bg-neutral-100 dark:bg-gradient-to-r dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-white/10 p-3 mb-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Your Standing</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          Rank #{userPart.rank || '—'}
                        </span>
                        <span className="text-neutral-400 dark:text-neutral-500">•</span>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                          Best: {userPart.bestScore}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Attempts</span>
                      <span className="text-xs font-black text-neutral-900 dark:text-white font-mono">
                        {userPart.attempts} / 10
                      </span>
                    </div>
                  </div>
                )}

                {/* Main Action Button */}
                <div className="mt-2 space-y-2">
                  {!hasJoined && !isEnded && (
                    <button
                      onClick={() => handleJoinTournament(tourney)}
                      disabled={joiningId === tourney._id}
                      className="w-full btn-primary-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {joiningId === tourney._id ? 'Joining...' : `Join Tournament (${tourney.entryFee} PTS)`}
                      </span>
                    </button>
                  )}

                  {hasJoined && !isEnded && (
                    <>
                      {userPart.attempts < 10 ? (
                        <button
                          onClick={() => handlePlayTournamentMatch(tourney)}
                          className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all"
                        >
                          {userPart.attempts === 0 ? (
                            <>
                              <Play className="w-4 h-4 fill-current" />
                              <span>Play Match (Attempt 1/10)</span>
                            </>
                          ) : (
                            <>
                              <Tv className="w-4 h-4" />
                              <span>Watch Ad & Play Again (Attempt {userPart.attempts + 1}/10)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-3 rounded-2xl text-xs font-bold text-center bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
                          All 10 Attempts Completed • Best: {userPart.bestScore}
                        </div>
                      )}
                    </>
                  )}

                  {isEnded && (
                    <div className="w-full py-3 rounded-2xl text-xs font-bold text-center bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
                      Tournament Completed
                    </div>
                  )}

                  {/* Toggle Leaderboard */}
                  <button
                    onClick={() => toggleLeaderboard(tourney._id)}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <span>Leaderboard ({tourney.leaderboard?.length || 0})</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Leaderboard Section */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-white/5 space-y-2 animate-fade-in">
                    <h4 className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
                      Top 10 Participants
                    </h4>

                    {(!tourney.leaderboard || tourney.leaderboard.length === 0) && (
                      <div className="text-center py-4 text-xs text-neutral-500">
                        No scores recorded yet. Be the first to play!
                      </div>
                    )}

                    {tourney.leaderboard?.map((p) => {
                      const isMe = String(p.telegramId) === String(user?.telegramId);
                      return (
                        <div
                          key={p.telegramId}
                          className={`rounded-xl px-3 py-2 flex items-center justify-between text-xs ${
                            isMe
                              ? 'bg-neutral-200 dark:bg-white/15 border border-neutral-300 dark:border-white/25 font-bold'
                              : 'bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 text-center font-mono font-black text-neutral-500 dark:text-neutral-400">
                              {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
                            </span>
                            <span className="truncate text-neutral-900 dark:text-white font-medium">
                              {p.firstName || p.username} {isMe ? '(You)' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                              {p.attempts}/10 tries
                            </span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                              {p.bestScore}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Participant's rank if not in top 10 */}
                    {hasJoined && userPart?.rank > 10 && (
                      <div className="rounded-xl px-3 py-2 flex items-center justify-between text-xs bg-neutral-200 dark:bg-white/10 border border-neutral-300 dark:border-white/20 mt-2 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">#{userPart.rank}</span>
                          <span className="text-neutral-900 dark:text-white">You</span>
                        </div>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {userPart.bestScore} PTS
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. APP TASKS VIEW */}
      {/* ======================================================== */}
      {selectedCategory === 'app_tasks' && (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isStarted = task.status === 'started' || Boolean(localStarted[task._id]);
            const timer = activeTimers[task._id];

            return (
              <div
                key={task._id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between border border-neutral-200 dark:border-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                    <Smartphone className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-bold text-yellow-600 dark:text-yellow-400 font-mono">
                        +{formatPoints(task.reward)} PTS
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        {task.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {isCompleted ? (
                    <div className="flex items-center gap-1 rounded-xl bg-green-50 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </div>
                  ) : timer > 0 ? (
                    <div className="flex items-center gap-1 rounded-xl bg-neutral-100 dark:bg-white/5 px-3 py-1.5 text-xs font-semibold text-neutral-500">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{timer}s</span>
                    </div>
                  ) : isStarted ? (
                    <button
                      onClick={() => claimTaskReward(task._id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-black shadow-lg bg-white text-black active:scale-95 transition-all"
                    >
                      Verify & Claim
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartTask(task)}
                      className="btn-primary-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      Open App
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loadingTasks && (
            <div className="space-y-2.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-2xl bg-neutral-200/50 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {filteredTasks.length === 0 && !loadingTasks && (
            <div className="text-center py-8 text-xs text-neutral-400">
              No active app tasks right now.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
