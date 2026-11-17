import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { showAdsgramRewardAd } from '../../services/ads';
import { sound } from '../../services/audio';
import { triggerHaptic } from '../../services/telegram';
import { Award, Tv, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BossVictoryModal() {
  const { showBossVictoryModal, setShowBossVictoryModal, setUser, showToast, setIsPlaying, switchTab } = useGame();
  const [claiming, setClaiming] = useState(false);

  if (!showBossVictoryModal) return null;

  const handleWatchAdToClaim = async () => {
    try {
      setClaiming(true);
      triggerHaptic('medium');

      // 1. Show Adsgram reward ad
      await showAdsgramRewardAd(async () => {
        // 2. Call backend claim endpoint atomically
        const res = await api.claimBossReward();
        if (res.success && res.user) {
          setUser(res.user);
          sound.playPowerup();
          triggerHaptic('success');

          // Celebrate with confetti!
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });

          showToast('🎉 Successfully claimed 200 Boss Coins!', 'success');
          setShowBossVictoryModal(false);
          setIsPlaying(false);
          switchTab('arena');
        }
      });
    } catch (err) {
      console.error('Claim boss reward error:', err);
      showToast('Error claiming reward: ' + err.message, 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] border border-yellow-500/40 p-6 text-neutral-900 dark:text-white shadow-2xl text-center relative overflow-hidden transition-colors">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
          <Award className="w-9 h-9 text-yellow-500 dark:text-yellow-400 animate-pulse" />
        </div>

        <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-[11px] font-bold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider">
          Boss Defeated!
        </span>

        <h3 className="text-2xl font-black tracking-tight mt-2 text-neutral-900 dark:text-white">Mothership Destroyed</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          You earned a special <span className="text-yellow-600 dark:text-yellow-400 font-bold">+200 Coins</span> bonus!
        </p>

        {/* Reward Card */}
        <div className="my-5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-4 border border-neutral-200 dark:border-white/5 text-center">
          <span className="text-3xl font-black text-yellow-600 dark:text-yellow-400 font-mono tracking-tight block">
            +200 PTS
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 block font-medium">
            Watch a sponsor video to claim your reward. Game is locked until coins are claimed.
          </span>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleWatchAdToClaim}
          disabled={claiming}
          className="w-full btn-primary-white py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 font-bold shadow-xl transition-all"
        >
          <Tv className="w-4 h-4 text-inherit" />
          <span>{claiming ? 'Verifying Sponsor Ad...' : 'Watch Ad & Claim 200 Coins'}</span>
        </button>

        <button
          onClick={() => {
            setShowBossVictoryModal(false);
            setIsPlaying(false);
            switchTab('arena');
          }}
          className="w-full btn-secondary-dark py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 mt-2"
        >
          <span>Back to Arena</span>
        </button>

        <p className="mt-3 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
          Powered by Adsgram Rewards
        </p>
      </div>
    </div>
  );
}
