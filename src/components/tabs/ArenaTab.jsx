import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { triggerHaptic } from '../../services/telegram';
import {
  Play,
  Tv,
  Lock,
  Gamepad2,
} from 'lucide-react';
import { formatPoints } from '../../utils/formatters';

export default function ArenaTab() {
  const navigate = useNavigate();
  const {
    user,
    setShowBossVictoryModal,
  } = useGame();

  const wonToday = user ? user.wonToday : 0;
  const hasBossLock = user ? user.bossKillPendingClaim : false;

  // Energy / Match limit logic (50 matches per 12 hours)
  const energy = user?.gameEnergy || { matchesRemaining: 50, lastResetAt: new Date() };
  const matchesRemaining = energy.matchesRemaining ?? 50;
  const energyPercent = Math.min(100, Math.max(0, (matchesRemaining / 50) * 100));

  return (
    <div className="space-y-4 px-4 pb-28 pt-1">
      {/* 1. PAID PLAYS LEFT CARD (Matching Reference Image 6 Top Card) */}
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

      {/* 2. FEATURED GAME 1: ASTEROID BLASTER (Matching Reference Image 6, without inside progress bar) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          navigate('/arena/asteroid-blaster');
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

          {/* Right Vector Graphic */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center z-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <circle cx="35" cy="26" r="14" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="78" cy="20" r="9" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
              <line x1="15" y1="68" x2="85" y2="68" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 3" />
              <line x1="50" y1="22" x2="50" y2="64" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="5 3" />
              <polygon points="50,60 41,78 50,72 59,78" fill="#ffffff" />
            </svg>
          </div>
        </div>

        {/* Footer Row: Difficulty Pills + Play Now Button (Inside progress bar removed as requested!) */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10">
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

      {/* 3. GAME 2: MINI RACING (Matching Reference Image 3/6, without inside progress bar) */}
      <div
        onClick={() => {
          triggerHaptic('light');
          navigate('/arena/mini-racing');
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

          {/* Right Vector Graphic */}
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

        {/* Footer Row: Difficulty Pills + Play Now Button (Inside progress bar removed as requested!) */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10">
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
