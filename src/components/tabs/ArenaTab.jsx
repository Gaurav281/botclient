import React, { useState } from 'react';
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
  ArrowLeft,
  ArrowRight,
  Shield,
  Crosshair,
  Sparkles,
  Info,
  CheckCircle2,
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

  // State to track whether user is viewing the Arena games menu or a dedicated game detail page
  const [selectedGame, setSelectedGame] = useState(null); // null | 'asteroid_blaster' | 'diamond_highway'

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

  const currentReward = difficultyRewards[difficulty]?.pts || 150;

  // =========================================================================
  // VIEW 1: DEDICATED GAME DETAIL PAGE - ASTEROID BLASTER
  // =========================================================================
  if (selectedGame === 'asteroid_blaster') {
    return (
      <div className="space-y-4 px-4 pb-28 pt-2 animate-fade-in">
        {/* Back Button & Title */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedGame(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Arena</span>
          </button>

          <span className="text-[10px] font-mono uppercase font-bold text-neutral-400">
            Game Details
          </span>
        </div>

        {/* Hero Showcase Card */}
        <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors border border-neutral-200 dark:border-white/10">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Space Shooter • Action
              </span>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-1.5">
                Asteroid Blaster
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[230px]">
                Defend the galaxy against rogue fighter squadrons and destroy the Mothership boss.
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
              <Rocket className="w-10 h-10" />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-neutral-200 dark:border-white/5 text-center">
            <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">High Score</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white font-mono">
                {formatPoints(highScore)}
              </span>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Win Reward</span>
              <span className="text-sm font-black text-emerald-500 font-mono">
                Up to 220 PTS
              </span>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Match Limit</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white font-mono">
                {matchesRemaining} / 50
              </span>
            </div>
          </div>
        </div>

        {/* Boss Lock Banner (if active) */}
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

        {/* How to Play & Controls Card */}
        <div className="glass-card rounded-3xl p-5 border border-neutral-200 dark:border-white/10 space-y-3.5">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            How to Play & Controls
          </h3>

          <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                1
              </div>
              <p>
                <strong className="text-neutral-900 dark:text-white">Touch & Drag:</strong> Drag your finger anywhere on screen to smoothly maneuver your starfighter. Blasters fire automatically.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                2
              </div>
              <p>
                <strong className="text-neutral-900 dark:text-white">Squadrons & Safe Zone:</strong> Enemies attack in trios. When enemies descend into the bottom 30% of the screen, they cease firing so you can safely dogfight.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                3
              </div>
              <p>
                <strong className="text-neutral-900 dark:text-white">Continuous Upgrades:</strong> Powerup capsules (Shields, Spread Shots, Rapid Fire) continuously drop throughout waves and the boss fight.
              </p>
            </div>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="glass-card rounded-3xl p-5 border border-neutral-200 dark:border-white/10">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider font-mono mb-3">
            Select Difficulty
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(difficultyRewards).map(([key, item]) => {
              const Icon = item.icon;
              const isSelected = difficulty === key;

              return (
                <button
                  key={key}
                  onClick={() => handleDifficultySelect(key)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md font-bold'
                      : 'bg-white dark:bg-[#141418] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/5 hover:border-neutral-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white dark:text-black' : 'text-neutral-400'}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-neutral-300 dark:text-neutral-700 font-semibold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    +{item.pts} PTS
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Launch Game Button */}
        <div className="pt-2">
          <button
            onClick={() => launchGame(difficulty, 'asteroid_blaster')}
            disabled={hasBossLock || matchesRemaining <= 0}
            className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl uppercase tracking-wider transition-all ${
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
                <span>Launch Asteroid Blaster • Win +{currentReward} PTS</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DEDICATED GAME DETAIL PAGE - DIAMOND HIGHWAY
  // =========================================================================
  if (selectedGame === 'diamond_highway') {
    return (
      <div className="space-y-4 px-4 pb-28 pt-2 animate-fade-in">
        {/* Back Button & Title */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedGame(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-200 dark:bg-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Arena</span>
          </button>

          <span className="text-[10px] font-mono uppercase font-bold text-neutral-400">
            Game Details
          </span>
        </div>

        {/* Hero Showcase Card */}
        <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors border border-neutral-200 dark:border-white/10">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                3-Lane Runner • Arcade
              </span>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-1.5">
                Diamond Highway
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[230px]">
                High-speed 3-lane traffic runner. Shift lanes, dodge commuter vehicles & collect shiny diamonds!
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 shadow-inner">
              <Car className="w-10 h-10" />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-neutral-200 dark:border-white/5 text-center">
            <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Lanes</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white font-mono">
                3 Lanes
              </span>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Diamond Value</span>
              <span className="text-sm font-black text-cyan-500 dark:text-cyan-400 font-mono">
                +50 PTS / 💎
              </span>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-white/[0.04] p-2.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block">Match Limit</span>
              <span className="text-sm font-black text-neutral-900 dark:text-white font-mono">
                {matchesRemaining} / 50
              </span>
            </div>
          </div>
        </div>

        {/* How to Play & Controls Card */}
        <div className="glass-card rounded-3xl p-5 border border-neutral-200 dark:border-white/10 space-y-3.5">
          <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider font-mono">
            How to Play & Controls
          </h3>

          <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                1
              </div>
              <p>
                <strong className="text-neutral-900 dark:text-white">Tap to Steer:</strong> Tap the left, center, or right area of your screen to switch between the 3 highway lanes immediately.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                2
              </div>
              <p>
                <strong className="text-neutral-900 dark:text-white">Collect Shiny Diamonds:</strong> Grab glowing blue diamonds scattered along open lanes to bank PTS directly into your wallet.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                3
              </div>
              <p>
                <strong className="text-neutral-900 dark:text-white">Dodge Traffic:</strong> Speed ramps up continuously. Avoid colliding with trucks, sports cars, and sedans to keep your run alive!
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tips Card */}
        <div className="rounded-2xl bg-cyan-500/5 border border-cyan-500/20 p-4 space-y-1.5 text-xs">
          <span className="font-bold text-cyan-500 dark:text-cyan-400 block">💡 Pro Racing Tip</span>
          <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
            Look two vehicle lengths ahead rather than staring right at your car so you can anticipate gap openings before the highway speeds up.
          </p>
        </div>

        {/* Launch Game Button */}
        <div className="pt-2">
          <button
            onClick={() => launchGame('normal', 'car_runner')}
            disabled={matchesRemaining <= 0}
            className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl uppercase tracking-wider transition-all ${
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
                <span>Launch Diamond Highway • Collect Diamonds</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MAIN ARENA GAMES LIST (CARD FORMAT ONLY)
  // =========================================================================
  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      {/* 1. Header with Rules & Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">Game Arena</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pick a game to see details & start playing
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

      {/* ================= AVAILABLE GAMES LIST (CARD FORMAT) ================= */}

      {/* GAME CARD 1: ASTEROID BLASTER */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setSelectedGame('asteroid_blaster');
        }}
        className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-all border border-neutral-200 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 cursor-pointer active:scale-[0.99] group shadow-sm"
      >
        <div className="flex justify-between items-start">
          <div className="z-10">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Space Shooter
              </span>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">
                Up to 220 PTS
              </span>
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white group-hover:text-cyan-500 transition-colors">
              Asteroid Blaster
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[210px] leading-relaxed">
              Dodge asteroids, blast enemy squadrons & defeat the Mothership boss.
            </p>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
            <Rocket className="w-8 h-8" />
          </div>
        </div>

        {/* Highlights Row & View CTA */}
        <div className="mt-4 pt-3.5 border-t border-neutral-200/80 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
            <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5">3 Modes</span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5">Boss Battle</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white group-hover:translate-x-0.5 transition-transform">
            <span>View & Play</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* GAME CARD 2: DIAMOND HIGHWAY */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setSelectedGame('diamond_highway');
        }}
        className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-all border border-neutral-200 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 cursor-pointer active:scale-[0.99] group shadow-sm"
      >
        <div className="flex justify-between items-start">
          <div className="z-10">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                3-Lane Runner
              </span>
              <span className="text-[10px] font-mono text-cyan-500 dark:text-cyan-400 font-bold">
                +50 PTS / 💎
              </span>
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white group-hover:text-cyan-500 transition-colors">
              Diamond Highway
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-[210px] leading-relaxed">
              Tap lanes to steer your supercar, collect shiny diamonds & dodge traffic!
            </p>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
            <Car className="w-8 h-8" />
          </div>
        </div>

        {/* Highlights Row & View CTA */}
        <div className="mt-4 pt-3.5 border-t border-neutral-200/80 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
            <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5">3 Lanes</span>
            <span className="px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5">Endless Rush</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white group-hover:translate-x-0.5 transition-transform">
            <span>View & Play</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* 4. Best Score & Record Stats */}
      <div className="grid grid-cols-2 gap-3 pt-1">
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
