import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { showAdsgramRewardAd } from '../../services/ads';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import { useTasksQuery } from '../../hooks/queries';
import {
  Users,
  Calendar,
  Sparkles,
  Handshake,
  Tv,
  CheckCircle2,
  Clock,
  Smile,
  Smartphone,
  Zap,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPoints } from '../../utils/formatters';

export default function TasksTab() {
  const { setUser, showToast } = useGame();
  const { data: tasksData, isLoading, refetch } = useTasksQuery();

  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('preferred_task_cat') || 'app_tasks';
  });
  const [activeTimers, setActiveTimers] = useState({});
  const [localStarted, setLocalStarted] = useState({});

  const tasks = tasksData?.tasks || [];
  const enabledCategories = tasksData?.enabledCategories || {
    app_tasks: true,
    daily: true,
    social: true,
    partner: true,
    exclusive: true,
  };

  useEffect(() => {
    const pref = sessionStorage.getItem('preferred_task_cat');
    if (pref) {
      setSelectedCategory(pref);
      sessionStorage.removeItem('preferred_task_cat');
    }
  }, []);

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
        refetch();

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
        refetch();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const allCategories = [
    { id: 'app_tasks', label: 'App Tasks', icon: Smartphone },
    { id: 'daily', label: 'Daily', icon: Calendar },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'partner', label: 'Partner', icon: Handshake },
    { id: 'exclusive', label: 'Exclusive', icon: Sparkles },
  ];

  // Filter out categories disabled by admin
  const visibleCategories = allCategories.filter(
    (c) => enabledCategories[c.id] !== false
  );

  // If current category is hidden by admin, fallback to first active
  const activeCategory = visibleCategories.some((c) => c.id === selectedCategory)
    ? selectedCategory
    : visibleCategories[0]?.id || 'daily';

  const filteredTasks = tasks.filter((t) => t.category === activeCategory);
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const stillToEarn = tasks
    .filter((t) => t.status !== 'completed')
    .reduce((sum, t) => sum + (t.reward || 0), 0);

  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      {/* Progress Card */}
      <div className="glass-card-elevated rounded-3xl p-5 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm">
            <Smile className="w-7 h-7 animate-bounce-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Completed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono">{completedCount}</span>
              <span className="text-xs text-neutral-400 font-mono">/{tasks.length}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block">Still To Earn</span>
          <div className="flex items-center justify-end gap-1.5 mt-0.5">
            <span className="text-lg font-bold text-yellow-500 dark:text-yellow-400 font-mono">
              +{formatPoints(stillToEarn)}
            </span>
            <span className="text-xs text-neutral-400">PTS</span>
          </div>
        </div>
      </div>

      {/* Category Pills (Only displays categories enabled in Admin panel) */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, visibleCategories.length)}, minmax(0, 1fr))`,
        }}
      >
        {visibleCategories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          const remainingForCat = tasks.filter((t) => t.category === cat.id && t.status !== 'completed').length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('selection');
                setSelectedCategory(cat.id);
              }}
              className={`relative flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${isSelected
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg font-bold'
                  : 'bg-white dark:bg-[#141418] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/5 hover:text-black dark:hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-semibold truncate px-1">{cat.label}</span>
              {remainingForCat > 0 && (
                <span
                  className={`absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black ${isSelected
                      ? 'bg-neutral-800 text-white dark:bg-black dark:text-white'
                      : 'bg-emerald-500 text-white'
                    }`}
                >
                  {remainingForCat}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const isStarted = task.status === 'started' || Boolean(localStarted[task._id]);
          const timer = activeTimers[task._id];
          const isAppTask = task.actionType === 'app_task' || task.category === 'app_tasks';

          return (
            <div
              key={task._id}
              className="glass-card rounded-2xl p-4 flex items-center justify-between border border-neutral-200 dark:border-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                  {isAppTask ? (
                    <Smartphone className="w-5 h-5 text-emerald-500" />
                  ) : task.actionType === 'ad_watch' ? (
                    <Tv className="w-5 h-5 text-green-500" />
                  ) : task.actionType === 'telegram' ? (
                    <Users className="w-5 h-5 text-cyan-500" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                  )}
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
                    className="px-3.5 py-2 rounded-xl text-xs font-black shadow-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black active:scale-95 animate-firefly-glow transition-all"
                  >
                    {isAppTask ? 'Verify & Claim' : 'Claim'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartTask(task)}
                    className="btn-primary-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {isAppTask ? 'Open App' : task.actionType === 'ad_watch' ? 'Watch' : 'Start'}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-neutral-200/50 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {filteredTasks.length === 0 && !isLoading && (
          <div className="text-center py-8 text-xs text-neutral-400">
            No active tasks in this category right now.
          </div>
        )}
      </div>
    </div>
  );
}
