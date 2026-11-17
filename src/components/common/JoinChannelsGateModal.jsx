import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import {
  Megaphone,
  MessageCircle,
  ShieldCheck,
  RotateCw,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function JoinChannelsGateModal() {
  const { user, setUser, showToast } = useGame();
  const [verifying, setVerifying] = useState(false);

  // Synchronous local storage check to avoid even a 1-frame flash on game exit or page reload
  const [isJoinedLocally, setIsJoinedLocally] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('firefly_channels_joined') === 'true';
  });

  // Track joined status of the 3 chats
  const [status, setStatus] = useState({
    channel: false,
    group: false,
    payouts: false,
  });

  // Keep localStorage in sync if user already marked joined
  useEffect(() => {
    if (user?.hasJoinedChannels) {
      localStorage.setItem('firefly_channels_joined', 'true');
      setIsJoinedLocally(true);
    }
  }, [user?.hasJoinedChannels]);

  // Query channel status on mount
  useEffect(() => {
    if (!user || user.hasJoinedChannels || isJoinedLocally) return;

    let isMounted = true;
    api.getChannelsStatus().then((res) => {
      if (isMounted && res.success) {
        setStatus({
          channel: !!res.channel,
          group: !!res.group,
          payouts: !!res.payouts,
        });
        if (res.allJoined) {
          localStorage.setItem('firefly_channels_joined', 'true');
          setIsJoinedLocally(true);
          setUser({ ...user, hasJoinedChannels: true });
        }
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [user, isJoinedLocally]);

  // If user already joined or not loaded yet, don't show
  if (!user || user.hasJoinedChannels || isJoinedLocally) return null;

  const joinedCount = (status.channel ? 1 : 0) + (status.group ? 1 : 0) + (status.payouts ? 1 : 0);
  const progressPercent = Math.round((joinedCount / 3) * 100);

  const handleOpenLink = (url, type) => {
    triggerHaptic('medium');
    setStatus((prev) => ({ ...prev, [type]: true }));

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      triggerHaptic('heavy');

      const res = await api.verifyChannels({ groupJoined: status.group });
      if (res.success && res.user) {
        localStorage.setItem('firefly_channels_joined', 'true');
        setIsJoinedLocally(true);
        setUser(res.user);
        sound.playPowerup();
        triggerHaptic('success');

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 },
        });

        showToast(res.message || "Welcome! You're ready to play!", 'success');
      }
    } catch (err) {
      console.warn('Channel verification error:', err);
      showToast(err.message || 'Please join @FireflyPlay and tap "I\'ve joined"!', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-8 app-dotted-bg text-neutral-900 dark:text-white select-none transition-colors overflow-y-auto">
      {/* Top spacer */}
      <div className="h-4" />

      {/* Main Container matching Reference Image 2 */}
      <div className="w-full max-w-sm mx-auto my-auto flex flex-col items-center text-center">
        {/* Emblem */}
        <div className="w-20 h-20 rounded-full bg-white dark:bg-[#141418] border border-neutral-300 dark:border-white/20 flex items-center justify-center mb-5 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-black dark:bg-white inline-block" />
            <span className="w-6 h-6 rounded-full border-2 border-black dark:border-white inline-block" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
          One step to play
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 px-2 leading-relaxed">
          Join these chats for codes, drops and news, then tap &ldquo;I&apos;ve joined&rdquo;.
        </p>

        {/* Progress Bar & Counter */}
        <div className="w-full mt-6 mb-4">
          <div className="flex justify-end text-[11px] font-mono text-neutral-400 font-bold mb-1.5">
            <span>{joinedCount}/3 joined</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Chat Cards Stack */}
        <div className="w-full space-y-2.5 my-2">
          {/* Card 1: Channel */}
          <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">Firefly</h4>
                <span className="text-[11px] text-neutral-400 font-medium block">📢 Channel</span>
              </div>
            </div>

            {status.channel ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-500 font-bold text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Joined</span>
              </span>
            ) : (
              <button
                onClick={() => handleOpenLink('https://t.me/FireflyPlay', 'channel')}
                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <span>Join</span>
                <span className="text-xs">↗</span>
              </button>
            )}
          </div>

          {/* Card 2: Group */}
          <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">Firefly Chat</h4>
                <span className="text-[11px] text-neutral-400 font-medium block">👥 Group</span>
              </div>
            </div>

            {status.group ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-500 font-bold text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Joined</span>
              </span>
            ) : (
              <button
                onClick={() => handleOpenLink('https://t.me/+K1hfu9rlv9kwYzA9', 'group')}
                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <span>Join</span>
                <span className="text-xs">↗</span>
              </button>
            )}
          </div>

          {/* Card 3: Payouts Channel */}
          <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-neutral-200 dark:border-white/10 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">Firefly Payouts</h4>
                <span className="text-[11px] text-neutral-400 font-medium block">📢 Channel</span>
              </div>
            </div>

            {status.payouts ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-500 font-bold text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Joined</span>
              </span>
            ) : (
              <button
                onClick={() => handleOpenLink('https://t.me/FireflyPayouts', 'payouts')}
                className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <span>Join</span>
                <span className="text-xs">↗</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Bottom Action Button */}
        <div className="w-full mt-6">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full py-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all disabled:opacity-50"
          >
            {verifying ? (
              <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{verifying ? "Checking Telegram..." : "I've joined"}</span>
          </button>

          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center mt-3">
            We check it with Telegram. It can take a few seconds after you join.
          </p>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="h-2" />
    </div>
  );
}
