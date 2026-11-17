import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { triggerHaptic } from '../../services/telegram';
import {
  Play,
  HelpCircle,
  Trophy,
  Coins,
  Sprout,
  Swords,
  Flame,
  Lock,
  Tv,
} from 'lucide-react';
import { formatPoints } from '../../utils/formatters';

export default function ArenaTab() {
  const {
    user,
    launchGame,
    difficulty,
    setDifficulty,
    setShowRulesModal,
    setShowBossVictoryModal,
  } = useGame();

  const [fullscreenMode, setFullscreenMode] = useState(user?.alwaysFullScreen ?? false);

  const handleDifficultySelect = (diff) => {
    triggerHaptic('selection');
    setDifficulty(diff);
  };

  const handleToggleFullscreen = async () => {
    triggerHaptic('light');
    const newVal = !fullscreenMode;
    setFullscreenMode(newVal);
    try {
      await api.updatePreferences({ alwaysFullScreen: newVal });
    } catch (e) {
      // ignore
    }
  };

  const wonToday = user ? user.wonToday : 0;
  const highScore = user ? user.highScore : 0;
  const hasBossLock = user ? user.bossKillPendingClaim : false;

  const difficultyRewards = {
    easy: { pts: 100, label: 'Easy', icon: Sprout, sub: '4 lives, slow enemies' },
    normal: { pts: 150, label: 'Normal', icon: Swords, sub: 'Fighters aim at you' },
    hard: { pts: 220, label: 'Hard', icon: Flame, sub: 'Heavy fire, 2 lives' },
  };

  const currentReward = difficultyRewards[difficulty].pts;

  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      {/* 1. Header Bar with Rules Button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Asteroid Blaster game, choose difficulty.
        </p>

        <button
          onClick={() => {
            triggerHaptic('light');
            setShowRulesModal(true);
          }}
          className="flex items-center gap-1.5 rounded-full bg-neutral-200 dark:bg-white/10 border border-neutral-300 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Rules</span>
        </button>
      </div>

      {/* 2. Fullscreen Toggle */}
      <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between transition-colors">
        <div>
          <span className="text-xs font-bold text-neutral-900 dark:text-white block">Always play full screen</span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Action games open edge to edge</span>
        </div>
        <button
          onClick={handleToggleFullscreen}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            fullscreenMode ? 'bg-black dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
          }`}
        >
          <span
            className={`block h-4 w-4 rounded-full transition-transform ${
              fullscreenMode
                ? 'translate-x-6 bg-white dark:bg-black'
                : 'translate-x-1 bg-white dark:bg-white'
            }`}
          />
        </button>
      </div>

      {/* 3. Boss Lock Warning Banner */}
      {hasBossLock && (
        <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Tv className="w-6 h-6 text-yellow-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">200 Boss Coins Ready!</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Watch ad to claim before next battle.</p>
            </div>
          </div>
          <button
            onClick={() => setShowBossVictoryModal(true)}
            className="btn-primary-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow-md"
          >
            Claim 200
          </button>
        </div>
      )}

      {/* 4. Featured Asteroid Blaster Card */}
      <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors">
        <div className="flex justify-between items-start">
          <div className="z-10">
            <span className="rounded-full bg-neutral-200 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Action
            </span>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">Asteroid Blaster</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[200px]">
              Blast enemy squadrons and the mothership boss
            </p>
          </div>

          {/* Spaceship Graphic */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 border border-neutral-300 dark:border-white/5 rounded-full" />
            <div className="h-10 w-0.5 border-r border-dashed border-neutral-400 dark:border-white/30" />
            <svg className="w-9 h-9 text-neutral-900 dark:text-white drop-shadow-[0_0_12px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 22l9-3 9 3L12 2z" />
            </svg>
            <div className="absolute top-2 right-2 h-4 w-4 rounded-full border border-neutral-400 dark:border-neutral-700 bg-neutral-200/40 dark:bg-neutral-800/40" />
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {Object.entries(difficultyRewards).map(([key, item]) => {
            const Icon = item.icon;
            const isSelected = difficulty === key;

            return (
              <button
                key={key}
                onClick={() => handleDifficultySelect(key)}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg'
                    : 'bg-white dark:bg-[#141418] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/5 hover:border-neutral-300'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white dark:text-black' : 'text-neutral-400'}`} />
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-neutral-300 dark:text-neutral-700 font-semibold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  +{item.pts}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
          {difficultyRewards[difficulty].sub}
        </p>

        {/* Big Launch Play Button */}
        <div className="mt-5">
          <button
            onClick={() => launchGame(difficulty)}
            disabled={hasBossLock}
            className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all ${
              !hasBossLock
                ? 'btn-primary-white active:scale-95'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {hasBossLock ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Claim Boss Reward to Unlock</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play • Up to {currentReward} PTS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. Best Score & Record */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-neutral-900 dark:text-white font-mono">
              {formatPoints(highScore)}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Personal Best</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-green-500 font-mono">
              +{formatPoints(wonToday)}
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Earned Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
