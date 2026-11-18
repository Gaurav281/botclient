import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { sound } from '../services/audio';
import { triggerHaptic } from '../services/telegram';
import {
  Play,
  HelpCircle,
  Trophy,
  Coins,
  Sprout,
  Swords,
  Flame,
  Clock,
  ChevronLeft,
  Volume2,
  VolumeX,
  Gamepad2,
} from 'lucide-react';
import { formatPoints } from '../utils/formatters';

export default function MiniRacingPage() {
  const navigate = useNavigate();
  const {
    user,
    launchGame,
    difficulty,
    setDifficulty,
    openRules,
  } = useGame();

  const [soundOn, setSoundOn] = useState(() => sound.enabled);

  const toggleSound = () => {
    triggerHaptic('light');
    const next = !soundOn;
    sound.setEnabled(next);
    setSoundOn(next);
  };

  const handleDifficultySelect = (diff) => {
    triggerHaptic('selection');
    setDifficulty(diff);
  };

  const wonToday = user ? user.wonToday : 0;
  const highScore = user ? user.highScore : 0;

  const energy = user?.gameEnergy || { matchesRemaining: 50, lastResetAt: new Date() };
  const matchesRemaining = energy.matchesRemaining ?? 50;
  const lastReset = new Date(energy.lastResetAt || Date.now()).getTime();
  const resetDurationMs = 12 * 60 * 60 * 1000;
  const nextResetMs = lastReset + resetDurationMs;
  const msLeft = Math.max(0, nextResetMs - Date.now());
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const energyPercent = Math.min(100, Math.max(0, (matchesRemaining / 50) * 100));

  const difficultyRewards = {
    easy: { pts: 100, label: 'Easy', icon: Sprout, sub: '3 lanes, slow traffic' },
    normal: { pts: 150, label: 'Normal', icon: Swords, sub: '4 lanes, 2 lives' },
    hard: { pts: 220, label: 'Hard', icon: Flame, sub: 'Fast traffic, 1 life' },
  };

  const currentReward = difficultyRewards[difficulty]?.pts || 150;
  const difficultySubtext = difficultyRewards[difficulty]?.sub || '4 lanes, 2 lives';

  return (
    <div className="min-h-screen text-neutral-900 dark:text-white px-4 pt-3 pb-32 animate-fade-in relative">
      {/* 1. TOP NAV BAR (Back <, Title, Sound, Help ?, Plays) */}
      <div className="flex items-center justify-between mb-3.5">
        <button
          onClick={() => {
            triggerHaptic('light');
            navigate('/arena');
          }}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm"
          aria-label="Back to Arena"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h2 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
          Mini Racing
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm"
            aria-label="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              openRules('car_runner');
            }}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm"
            aria-label="Game Rules Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="px-3 py-2 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 shadow-sm">
            {matchesRemaining}/50 plays
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* 2. HERO CARD (Always Permanent Dark Obsidian in both Light & Dark Theme matching reference) */}
        <div className="wallet-card-permanent-dark rounded-[28px] p-5 relative overflow-hidden flex items-center justify-between min-h-[140px] shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

          {/* Left Text */}
          <div className="z-10 max-w-[200px]">
            <span className="inline-block rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Action
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Mini Racing
            </h1>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed font-medium">
              Dodge traffic, hit the checkpoints
            </p>
          </div>

          {/* Right Vector Graphic (Highway lanes, opponent vehicles & player car) */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center z-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <line x1="33" y1="8" x2="33" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="66" y1="8" x2="66" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
              <rect x="13" y="18" width="14" height="24" rx="5" fill="rgba(255,255,255,0.25)" />
              <rect x="73" y="16" width="14" height="24" rx="5" fill="rgba(255,255,255,0.25)" />
              <rect x="42" y="52" width="16" height="28" rx="6" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* 3. DIFFICULTY SELECTOR (Matching Reference Images 3 & 4) */}
        <div>
          <div className="rounded-[26px] bg-neutral-100 dark:bg-white/[0.05] p-1.5 border border-neutral-200 dark:border-white/10 grid grid-cols-3 gap-1.5 shadow-sm">
            {Object.entries(difficultyRewards).map(([key, item]) => {
              const Icon = item.icon;
              const isSelected = difficulty === key;

              return (
                <button
                  key={key}
                  onClick={() => handleDifficultySelect(key)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg font-bold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white dark:text-black' : 'text-neutral-400'}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-mono">
                    <span className="opacity-70 text-[9px]">✦</span>
                    <span className="font-bold">{item.pts}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center mt-2.5">
            {difficultySubtext}
          </p>
        </div>

        {/* 4. PAID PLAYS LEFT CARD (Matching Reference) */}
        <div className="glass-card rounded-[26px] p-4 border border-neutral-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>PAID PLAYS LEFT</span>
            </div>

            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                {matchesRemaining}
              </span>
              <span className="text-sm font-mono text-neutral-400">/ 50</span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden my-1.5">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${energyPercent}%` }}
              />
            </div>

            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block">
              Paid plays · every 12h
            </span>
          </div>

          <div className="border-l border-neutral-200 dark:border-white/10 pl-5 text-right shrink-0">
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider block mb-1">
              ALL GAMES
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                50
              </span>
              <span className="text-sm font-mono text-neutral-400">/ 50</span>
            </div>
          </div>
        </div>

        {/* 5. STATS CARDS (Your best & Won today - Side-by-side) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="glass-card rounded-[24px] p-4 border border-neutral-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300 mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black font-mono text-neutral-900 dark:text-white block">
                {formatPoints(highScore)}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Your best
              </span>
            </div>
          </div>

          <div className="glass-card rounded-[24px] p-4 border border-neutral-200 dark:border-white/10 flex flex-col justify-between shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300 mb-2">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xl font-black font-mono text-neutral-900 dark:text-white block">
                {formatPoints(wonToday)}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Won today
              </span>
            </div>
          </div>
        </div>

        {/* 6. HOW TO PLAY CARD (Matching Reference Image 3) */}
        <div className="glass-card rounded-[26px] p-4 sm:p-5 border border-neutral-200 dark:border-white/10 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white">
              How to play
            </h3>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                openRules('car_runner');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all active:scale-95"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Guide</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p className="leading-snug">Swipe or tap a side to change lanes</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p className="leading-snug">Drive through checkpoints: +15 each</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p className="leading-snug">A crash costs a life; the race runs 90 seconds</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7. PERMANENTLY FIXED BOTTOM PLAY BUTTON (Visible at all times without scrolling!) */}
      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto p-4 bg-white/90 dark:bg-[#070709]/90 backdrop-blur-xl border-t border-neutral-200/80 dark:border-white/10 z-40">
        <button
          onClick={() => {
            triggerHaptic('medium');
            launchGame(difficulty, 'car_runner');
          }}
          disabled={matchesRemaining <= 0}
          className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-2xl transition-all ${
            matchesRemaining > 0
              ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95'
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
              <span>Play · up to {currentReward} PTS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
