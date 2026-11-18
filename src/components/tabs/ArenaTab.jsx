import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../services/audio';
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
  Clock,
  ChevronLeft,
  Volume2,
  VolumeX,
  Shield,
  Sparkles,
  Gamepad2,
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

  // Selected game details page: null | 'asteroid_blaster' | 'diamond_highway'
  const [selectedGame, setSelectedGame] = useState(null);

  // Sound toggle state
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
    easy: {
      pts: 100,
      label: 'Easy',
      icon: Sprout,
      subAsteroid: '4 lives, slow enemies',
      subCar: '3 lanes, slow traffic',
    },
    normal: {
      pts: 150,
      label: 'Normal',
      icon: Swords,
      subAsteroid: 'Fighters aim at you',
      subCar: '3 lanes, 2 lives',
    },
    hard: {
      pts: 220,
      label: 'Hard',
      icon: Flame,
      subAsteroid: 'Heavy fire, 2 lives',
      subCar: 'Heavy traffic, fast speed',
    },
  };

  const currentReward = difficultyRewards[difficulty]?.pts || 150;
  const energyPercent = Math.min(100, Math.max(0, (matchesRemaining / 50) * 100));

  // =========================================================================
  // VIEW: DEDICATED GAME PLAY PAGE (Matching Reference Images 1, 3, 4, 5)
  // =========================================================================
  if (selectedGame === 'asteroid_blaster' || selectedGame === 'diamond_highway') {
    const isAsteroid = selectedGame === 'asteroid_blaster';
    const gameTitle = isAsteroid ? 'Asteroid Blaster' : 'Mini Racing';
    const gameSubtitle = isAsteroid
      ? 'Blast enemy squadrons and the boss'
      : 'Dodge traffic, collect diamonds';
    const difficultySubtext = isAsteroid
      ? difficultyRewards[difficulty]?.subAsteroid
      : difficultyRewards[difficulty]?.subCar;

    return (
      <div className="space-y-3.5 px-4 pb-28 pt-2 animate-fade-in text-neutral-900 dark:text-white">
        {/* 1. TOP NAV BAR (Back <, Title, Sound, Help ?, Plays) */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              setSelectedGame(null);
            }}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm"
            aria-label="Back to Arena"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h2 className="text-base font-black tracking-tight text-neutral-900 dark:text-white">
            {gameTitle}
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
                setShowRulesModal(true);
              }}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all active:scale-95 shadow-sm"
              aria-label="How to play guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="px-3 py-2 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 shadow-sm">
              {matchesRemaining}/50 plays
            </div>
          </div>
        </div>

        {/* 2. HERO CARD (Always Permanent Dark Obsidian in both Light & Dark Theme matching reference) */}
        <div className="wallet-card-permanent-dark rounded-[28px] p-5 relative overflow-hidden flex items-center justify-between min-h-[140px] shadow-lg">
          {/* Subtle background dots inside card */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

          {/* Left Text */}
          <div className="z-10 max-w-[200px]">
            <span className="inline-block rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Action
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {gameTitle}
            </h1>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed font-medium">
              {gameSubtitle}
            </p>
          </div>

          {/* Right Graphic Illustration (Matches Reference Images 1, 3, 5) */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center z-10">
            {isAsteroid ? (
              // Asteroid Blaster Graphic: Dashed vertical trajectory, wireframe asteroids, white starfighter
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                {/* Asteroids Wireframe */}
                <circle cx="35" cy="26" r="14" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx="78" cy="20" r="9" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
                {/* Dotted Horizon Marker */}
                <line x1="15" y1="68" x2="85" y2="68" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 3" />
                {/* Vertical Laser Trail */}
                <line x1="50" y1="22" x2="50" y2="64" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="5 3" />
                {/* Starfighter Arrow */}
                <polygon points="50,60 41,78 50,72 59,78" fill="#ffffff" />
              </svg>
            ) : (
              // Mini Racing Graphic: Highway lanes, traffic vehicles & white player car
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                {/* 3 Highway Lanes with Dashed Dividers */}
                <line x1="33" y1="8" x2="33" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="66" y1="8" x2="66" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
                {/* Traffic Car Left Lane */}
                <rect x="13" y="18" width="14" height="24" rx="5" fill="rgba(255,255,255,0.25)" />
                {/* Traffic Car Right Lane */}
                <rect x="73" y="16" width="14" height="24" rx="5" fill="rgba(255,255,255,0.25)" />
                {/* Player White Supercar Center Lane */}
                <rect x="42" y="52" width="16" height="28" rx="6" fill="#ffffff" />
              </svg>
            )}
          </div>
        </div>

        {/* 3. DIFFICULTY SELECTOR (Matching Reference Images 1, 3, 5) */}
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

          {/* Subtext under difficulty selector */}
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 text-center mt-2.5">
            {difficultySubtext}
          </p>
        </div>

        {/* 4. PAID PLAYS LEFT CARD (Matching Reference: Left Progress + Right ALL GAMES) */}
        <div className="glass-card rounded-[26px] p-4 border border-neutral-200 dark:border-white/10 flex items-center justify-between shadow-sm">
          {/* Left section: PAID PLAYS LEFT */}
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

            {/* Vibrant Green Progress Bar */}
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

          {/* Right section: ALL GAMES */}
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

        {/* 5. STATS CARDS (Your best & Won today - Side-by-side matching reference) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Your Best Card */}
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

          {/* Won Today Card */}
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

        {/* 6. HOW TO PLAY CARD (Matching Reference Image 3 & 5) */}
        <div className="glass-card rounded-[26px] p-4 sm:p-5 border border-neutral-200 dark:border-white/10 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white">
              How to play
            </h3>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowRulesModal(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all active:scale-95"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Guide</span>
            </button>
          </div>

          {/* Steps List */}
          <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
            {isAsteroid ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="leading-snug">Drag to fly; your guns fire on their own</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="leading-snug">Shoot down the enemy squadrons and catch the upgrades they drop</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="leading-snug">Destroy the mothership at the end for a +300 bonus</p>
                </div>
              </>
            ) : (
              <>
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
                  <p className="leading-snug">Drive through diamonds: +50 PTS each</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-lg bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="leading-snug">A crash ends the run; dodge oncoming traffic</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 7. BOTTOM PLAY BUTTON (Matching Reference: ▶ Play · up to 150 PTS) */}
        <div className="pt-1">
          <button
            onClick={() => {
              triggerHaptic('medium');
              launchGame(difficulty, isAsteroid ? 'asteroid_blaster' : 'car_runner');
            }}
            disabled={hasBossLock || matchesRemaining <= 0}
            className={`w-full py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl transition-all ${
              !hasBossLock && matchesRemaining > 0
                ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95'
                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {hasBossLock && isAsteroid ? (
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
                <span>Play · up to {currentReward} PTS</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: MAIN ARENA VIEW (Matching Reference Image 6)
  // =========================================================================
  return (
    <div className="space-y-4 px-4 pb-28 pt-2">
      {/* 1. Header with Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
          Arena
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
          Play action games, three difficulties each. Harder levels pay more.
        </p>
      </div>

      {/* 2. PAID PLAYS LEFT CARD (Matching Reference Image 6 Top Card) */}
      <div className="glass-card rounded-[26px] p-4 border border-neutral-200 dark:border-white/10 flex items-center justify-between shadow-sm">
        {/* Left section: PAID PLAYS LEFT */}
        <div className="flex-1 pr-4">
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider block mb-1">
            PAID PLAYS LEFT
          </span>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
              {matchesRemaining}
            </span>
            <span className="text-sm font-mono text-neutral-400">/ 50</span>
          </div>

          {/* Green Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden my-1.5">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${energyPercent}%` }}
            />
          </div>

          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block">
            For all games · they come back 12h after your first play
          </span>
        </div>

        {/* Right section: WON TODAY */}
        <div className="border-l border-neutral-200 dark:border-white/10 pl-5 text-right shrink-0">
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider block mb-1">
            WON TODAY
          </span>
          <div className="flex items-center justify-end gap-1 text-emerald-500">
            <span className="text-xs font-mono font-bold">✦</span>
            <span className="text-2xl font-black font-mono">
              +{formatPoints(wonToday)}
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

      {/* 3. FEATURED GAME 1: ASTEROID BLASTER (Matching Reference Image 6) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setSelectedGame('asteroid_blaster');
        }}
        className="wallet-card-permanent-dark rounded-[28px] p-5 relative overflow-hidden transition-all cursor-pointer active:scale-[0.99] shadow-lg group border border-white/10"
      >
        <div className="flex justify-between items-start">
          <div className="z-10">
            <span className="inline-block rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Featured
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Asteroid Blaster
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mt-1.5">
              <span>✦ up to 220</span>
              <span>·</span>
              <span>{matchesRemaining}/50 plays</span>
            </div>
          </div>

          {/* Right Graphic */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center z-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="35" cy="26" r="14" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="78" cy="20" r="9" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
              <line x1="50" y1="22" x2="50" y2="64" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="5 3" />
              <polygon points="50,60 41,78 50,72 59,78" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Progress bar inside card */}
        <div className="flex items-center gap-2 mt-4 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {matchesRemaining}/50
          </span>
        </div>

        {/* Footer Row: Difficulty Pills + Play Now Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">Easy</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">Normal</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white font-bold border border-white/20">Hard</span>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play now</span>
          </button>
        </div>
      </div>

      {/* 4. GAME 2: MINI RACING / DIAMOND HIGHWAY (Matching Reference Image 3/6) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          setSelectedGame('diamond_highway');
        }}
        className="wallet-card-permanent-dark rounded-[28px] p-5 relative overflow-hidden transition-all cursor-pointer active:scale-[0.99] shadow-lg group border border-white/10"
      >
        <div className="flex justify-between items-start">
          <div className="z-10">
            <span className="inline-block rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Action
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Mini Racing
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mt-1.5">
              <span>✦ up to 220</span>
              <span>·</span>
              <span>{matchesRemaining}/50 plays</span>
            </div>
          </div>

          {/* Right Graphic */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center z-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <line x1="33" y1="8" x2="33" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="66" y1="8" x2="66" y2="92" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="4 4" />
              <rect x="13" y="18" width="14" height="24" rx="5" fill="rgba(255,255,255,0.25)" />
              <rect x="73" y="16" width="14" height="24" rx="5" fill="rgba(255,255,255,0.25)" />
              <rect x="42" y="52" width="16" height="28" rx="6" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Progress bar inside card */}
        <div className="flex items-center gap-2 mt-4 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${energyPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400">
            {matchesRemaining}/50
          </span>
        </div>

        {/* Footer Row: Difficulty Pills + Play Now Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">Easy</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">Normal</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white font-bold border border-white/20">Hard</span>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
