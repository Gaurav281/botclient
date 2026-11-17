import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
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
  Zap,
  Car,
  Rocket,
  Gem,
  Clock,
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

  const handleDifficultySelect = (diff) => {
    triggerHaptic('selection');
    setDifficulty(diff);
  };

  const wonToday = user ? user.wonToday : 0;
  const highScore = user ? user.highScore : 0;
  const hasBossLock = user ? user.bossKillPendingClaim : false;

  // Energy / Match limit logic (50 matches per 12 hours)
  const energy = user?.gameEnergy || { matchesRemaining: 50, lastResetAt: new Date() };
  const matchesRemaining = energy.matchesRemaining ?? 50;
  const lastReset = new Date(energy.lastResetAt || Date.now()).getTime();
  const resetDurationMs = 12 * 60 * 60 * 1000;
  const nextResetMs = lastReset + resetDurationMs;
  const msLeft = Math.max(0, nextResetMs - Date.now());
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const minsLeft = Math.ceil((msLeft % (1000 * 60 * 60)) / (1000 * 60));

  const difficultyRewards = {
    easy: { pts: 100, label: 'Easy', icon: Sprout, sub: '4 lives, slow enemies' },
    normal: { pts: 150, label: 'Normal', icon: Swords, sub: 'Fighters aim at you' },
    hard: { pts: 220, label: 'Hard', icon: Flame, sub: 'Heavy fire, 2 lives' },
  };

  const currentReward = difficultyRewards[difficulty].pts;

  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      {/* 1. Header with Rules & Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">Game Arena</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pick a game, climb leaderboards & earn PTS
          </p>
        </div>

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

      {/* 2. SHARED 12-HOUR MATCH LIMIT CARD (50 matches total) */}
      <div className="glass-card rounded-2xl p-4 border border-neutral-200 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Zap className="w-4 h-4 fill-amber-500/20" />
            </div>
            <div>
              <span className="text-xs font-black text-neutral-900 dark:text-white block">
                Match Limit
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Shared across all games
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-black font-mono text-neutral-900 dark:text-white">
              {matchesRemaining} <span className="text-xs text-neutral-400 font-normal">/ 50</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
              <Clock className="w-3 h-3" />
              <span>Resets in {hoursLeft}h {minsLeft}m</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              matchesRemaining > 15
                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                : matchesRemaining > 5
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-rose-500 to-red-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (matchesRemaining / 50) * 100))}%` }}
          />
        </div>
      </div>

      {/* 3. Boss Lock Warning Banner */}
      {hasBossLock && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Tv className="w-6 h-6 text-amber-500 shrink-0" />
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

      {/* ================= GAME 1: ASTEROID BLASTER ================= */}
      <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors border border-neutral-200 dark:border-white/10">
        <div className="flex justify-between items-start">
          <div className="z-10">
            <span className="rounded-full bg-neutral-200 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Space Shooter
            </span>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">Asteroid Blaster</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[210px]">
              Dodge asteroids, destroy enemy squadrons & conquer the Mothership boss
            </p>
          </div>

          {/* Spaceship Graphic Emblem */}
          <div className="relative w-20 h-20 flex items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Rocket className="w-9 h-9" />
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {Object.entries(difficultyRewards).map(([key, item]) => {
            const Icon = item.icon;
            const isSelected = difficulty === key;

            return (
              <button
                key={key}
                onClick={() => handleDifficultySelect(key)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
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

        {/* Play Button */}
        <div className="mt-4">
          <button
            onClick={() => launchGame(difficulty, 'asteroid_blaster')}
            disabled={hasBossLock || matchesRemaining <= 0}
            className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
              !hasBossLock && matchesRemaining > 0
                ? 'btn-primary-white active:scale-95'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {hasBossLock ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Claim Boss Reward to Play</span>
              </>
            ) : matchesRemaining <= 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Match Limit Reached (Resets in {hoursLeft}h)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Asteroid Blaster • Up to {currentReward} PTS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= GAME 2: DIAMOND HIGHWAY (CAR RUNNER) ================= */}
      <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors border border-neutral-200 dark:border-white/10">
        <div className="flex justify-between items-start">
          <div className="z-10">
            <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              3-Lane Runner
            </span>
            <h3 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">Diamond Highway</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[210px]">
              Tap lanes to steer your supercar, collect shiny diamonds & dodge traffic!
            </p>
          </div>

          {/* Car Graphic Emblem */}
          <div className="relative w-20 h-20 flex items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Car className="w-9 h-9" />
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-2.5 border border-neutral-200 dark:border-white/5 text-center">
            <span className="text-xs font-black text-neutral-900 dark:text-white font-mono block">3 Lanes</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Tap to steer</span>
          </div>

          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-2.5 border border-neutral-200 dark:border-white/5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Gem className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
              <span className="text-xs font-black text-cyan-500 dark:text-cyan-400 font-mono">+50 PTS</span>
            </div>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Per diamond</span>
          </div>

          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-2.5 border border-neutral-200 dark:border-white/5 text-center">
            <span className="text-xs font-black text-rose-500 font-mono block">Dodge</span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Avoid crashes</span>
          </div>
        </div>

        {/* Play Button */}
        <div>
          <button
            onClick={() => launchGame('normal', 'car_runner')}
            disabled={matchesRemaining <= 0}
            className={`w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
              matchesRemaining > 0
                ? 'btn-primary-white active:scale-95'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {matchesRemaining <= 0 ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Match Limit Reached (Resets in {hoursLeft}h)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Diamond Highway • Collect Diamonds</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Best Score & Record Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
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