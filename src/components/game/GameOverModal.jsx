import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Crosshair, Coins, RotateCcw, Home, Tv } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';
import { showAdsgramRewardAd } from '../../services/ads';
import AdsterraMinimalAd from '../common/AdsterraMinimalAd';

export default function GameOverModal() {
  const {
    showGameOverModal,
    setShowGameOverModal,
    lastGameResult,
    user,
    launchGame,
    difficulty,
    switchTab,
    setIsPlaying,
    activeTournament,
    setActiveTournament,
    activeGameType,
    claimPendingGameReward,
  } = useGame();

  const [isClaiming, setIsClaiming] = useState(false);

  if (!showGameOverModal) return null;

  const score = lastGameResult ? lastGameResult.score : 0;
  const kills = lastGameResult ? lastGameResult.kills : 0;
  // Difficulty cap: Easy 100, Normal 150, Hard 220
  let maxPts = 150;
  if (difficulty === 'easy') maxPts = 100;
  if (difficulty === 'hard') maxPts = 220;
  const earnedCoins = Math.min(maxPts, Math.floor(score / 10));

  const pendingRewardPts = user?.pendingGameReward?.pts ?? earnedCoins;
  const hasUnclaimedReward = !activeTournament && pendingRewardPts > 0;

  const handleWatchAdClaim = async () => {
    triggerHaptic('medium');
    setIsClaiming(true);
    await showAdsgramRewardAd(async () => {
      await claimPendingGameReward();
      setIsClaiming(false);
    }, {
      badgeText: 'MATCH REWARD CLAIM',
      title: activeGameType === 'car_runner' ? 'Mini Racing' : 'Asteroid Blaster',
      description: `Watch this clip to claim your ${pendingRewardPts} PTS!`,
    });
    setIsClaiming(false);
  };

  const handlePlayAgain = () => {
    triggerHaptic('medium');
    setShowGameOverModal(false);
    setIsPlaying(false);
    if (activeTournament) {
      setActiveTournament(null);
      switchTab('tasks');
    } else {
      setTimeout(() => {
        launchGame(difficulty, activeGameType);
      }, 50);
    }
  };

  const handleGoHome = () => {
    triggerHaptic('light');
    setShowGameOverModal(false);
    setIsPlaying(false);
    if (activeTournament) {
      setActiveTournament(null);
      sessionStorage.setItem('preferred_task_cat', 'tournaments');
      switchTab('tasks');
    } else {
      switchTab('arena');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-6 text-neutral-900 dark:text-white shadow-2xl text-center transition-colors">
        {/* Header Icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/20 shadow-sm">
          <Trophy className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
        </div>

        <h3 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
          {activeTournament
            ? 'Tournament Match Complete'
            : activeGameType === 'car_runner'
            ? 'Mini Racing Complete'
            : 'Mission Debrief'}
        </h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          {activeTournament
            ? `${activeTournament.title} • Score Submitted!`
            : hasUnclaimedReward
            ? `Watch sponsor clip to claim your ${pendingRewardPts} PTS`
            : activeGameType === 'car_runner'
            ? 'Great driving! Diamonds and score recorded.'
            : 'Your Asteroid Blaster battle results'}
        </p>

        {/* Stats Grid */}
        <div className="my-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">Score</span>
            <span className="text-base font-black text-neutral-900 dark:text-white font-mono">{score}</span>
          </div>

          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              {activeGameType === 'car_runner' ? 'Diamonds' : 'Kills'}
            </span>
            <span className={`text-base font-black font-mono ${
              activeGameType === 'car_runner' ? 'text-cyan-500 dark:text-cyan-400' : 'text-rose-500 dark:text-rose-400'
            }`}>
              {kills}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              {activeTournament ? 'Points' : 'Coins'}
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-green-400 font-mono">
              {activeTournament ? 'Score Only' : `+${earnedCoins}`}
            </span>
          </div>
        </div>

        {/* Minimal Adsterra Ad Integration */}
        <div className="my-3">
          <AdsterraMinimalAd />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-4">
          {/* If normal game and reward is unclaimed, user must watch ad to claim PTS! */}
          {hasUnclaimedReward ? (
            <button
              onClick={handleWatchAdClaim}
              disabled={isClaiming}
              className="w-full py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 font-black shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black active:scale-95 transition-all"
            >
              <Tv className="w-4 h-4 fill-current" />
              <span>{isClaiming ? 'Claiming PTS...' : `Watch Ad · Claim +${pendingRewardPts} PTS`}</span>
            </button>
          ) : !activeTournament ? (
            <button
              onClick={handlePlayAgain}
              className="w-full btn-primary-white py-3 rounded-2xl text-xs flex items-center justify-center gap-2 font-bold shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          ) : null}

          <button
            onClick={handleGoHome}
            className={`w-full py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 font-bold ${
              activeTournament ? 'btn-primary-white shadow-lg' : 'btn-secondary-dark'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{activeTournament ? 'Back to Tournaments' : 'Back to Arena'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
