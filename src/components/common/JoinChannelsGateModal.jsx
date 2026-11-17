import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { triggerHaptic } from '../../services/telegram';
import { sound } from '../../services/audio';
import {
  Bell,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function JoinChannelsGateModal() {
  const { user, setUser, showToast } = useGame();
  const [verifying, setVerifying] = useState(false);
  const [channelClicked, setChannelClicked] = useState(false);
  const [groupClicked, setGroupClicked] = useState(false);
  const [proofsClicked, setProofsClicked] = useState(false);

  // If user already verified or not loaded yet, don't show
  if (!user || user.hasJoinedChannels) return null;

  const handleOpenLink = (url, type) => {
    triggerHaptic('medium');
    if (type === 'channel') setChannelClicked(true);
    if (type === 'group') setGroupClicked(true);
    if (type === 'proofs') setProofsClicked(true);

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

      const res = await api.verifyChannels();
      if (res.success && res.user) {
        setUser(res.user);
        sound.playPowerup();
        triggerHaptic('success');

        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
        });

        showToast(res.message || 'Channels verified! Welcome to Firefly Play!', 'success');
      }
    } catch (err) {
      console.warn('Channel verification warning:', err);
      showToast(err.message || 'Please join @FireflyPlay and community group to continue!', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-sm rounded-[32px] bg-[#111116] border border-white/10 p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden transition-all my-auto">
        {/* Glowing atmospheric firefly orbs */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-orange-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Mascot Header */}
        <div className="text-center relative">
          <div className="relative inline-block mb-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full blur-md opacity-70 animate-pulse" />
            <img
              src="/firefly-mascot.png"
              alt="Firefly Mascot"
              className="relative w-20 h-20 mx-auto object-contain rounded-2xl drop-shadow-xl animate-bounce-slow"
              onError={(e) => {
                // Fallback emoji if image loading fails
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold tracking-wider uppercase mb-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Community Gate</span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white mt-1">
            Welcome to Firefly Play
          </h2>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            Join our official channels to unlock access, get daily tournament updates, and view verified payouts!
          </p>
        </div>

        {/* Steps Cards */}
        <div className="space-y-2.5 my-5">
          {/* Channel 1 */}
          <div
            onClick={() => handleOpenLink('https://t.me/FireflyPlay', 'channel')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              channelClicked
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-white/[0.04] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Firefly Channel</span>
                  {channelClicked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-neutral-400">@FireflyPlay • News & Drops</div>
              </div>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span>{channelClicked ? 'Joined' : 'Join'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Group 2 */}
          <div
            onClick={() => handleOpenLink('https://t.me/+K1hfu9rlv9kwYzA9', 'group')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              groupClicked
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-white/[0.04] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Community Chat</span>
                  {groupClicked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-neutral-400">Join discussion group</div>
              </div>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <span>{groupClicked ? 'Joined' : 'Join'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Channel 3 - Payout Proofs Channel */}
          <div
            onClick={() => handleOpenLink('https://t.me/FireflyPayouts', 'proofs')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              proofsClicked
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-white/[0.04] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Payout Proofs</span>
                  {proofsClicked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10px] text-neutral-400">@FireflyPayouts • Live proofs</div>
              </div>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[11px] flex items-center gap-1 border border-emerald-500/30 active:scale-95 transition-all"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Big Action Verify Button */}
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all hover:brightness-110 disabled:opacity-50"
        >
          {verifying ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Checking Membership...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-black text-black" />
              <span>Verify & Launch Game</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-neutral-500 mt-3 font-mono">
          Powered by Telegram Verification • Firefly Play
        </p>
      </div>
    </div>
  );
}
