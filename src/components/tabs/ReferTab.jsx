import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { api } from '../../services/api';
import { openTelegramShare, triggerHaptic } from '../../services/telegram';
import {
  Users,
  Send,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';
import { formatPoints, formatISTDateTime } from '../../utils/formatters';

export default function ReferTab() {
  const { user, showToast } = useGame();
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReferral() {
      try {
        const res = await api.getReferral();
        if (res.success) {
          setReferralData(res);
        }
      } catch (err) {
        console.warn('Referral fetch error:', err);
      }
    }
    loadReferral();
  }, []);

  const inviteLink =
    referralData?.inviteLink ||
    `https://t.me/FireflyPlayBot?start=${user?.referralCode || 'pilot'}`;

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    triggerHaptic('medium');
    openTelegramShare(
      inviteLink,
      '🚀 Battle in Asteroid Blaster with me! Get +500 welcome bonus and blast the mothership together.'
    );
  };

  const friends = referralData?.friends || [];
  const friendsCount = referralData?.friendsCount ?? user?.referralCount ?? 0;
  const activeCount = referralData?.activeFriendsCount ?? user?.activeReferrals ?? 0;
  const totalEarned = referralData?.totalEarned ?? user?.referralEarnings ?? 0;

  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      {/* Hero Card */}
      <div className="glass-card-elevated rounded-3xl p-5 relative overflow-hidden transition-colors">
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-snug">
            Invite friends,<br />earn together
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 max-w-[260px]">
            Every friend who joins pays you, and you keep 2% of what they earn. Forever.
          </p>

          {/* Reward Badges */}
          <div className="grid grid-cols-3 gap-2 my-4">
            <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-2.5 border border-neutral-200 dark:border-white/5 text-center">
              <span className="text-xs font-black text-neutral-900 dark:text-white font-mono block">+400</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">per friend</span>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-2.5 border border-neutral-200 dark:border-white/5 text-center">
              <span className="text-xs font-black text-neutral-900 dark:text-white font-mono block">+500</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">when active</span>
            </div>
            <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-2.5 border border-neutral-200 dark:border-white/5 text-center">
              <span className="text-xs font-black text-green-500 font-mono block">2%</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">for life</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 font-black shadow-lg bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-black shadow-amber-500/25 active:scale-95 animate-firefly-glow hover:brightness-110 transition-all"
            >
              <Send className="w-3.5 h-3.5 fill-black" />
              <span>Invite Friends (+400 PTS)</span>
            </button>

            <button
              onClick={handleCopy}
              className="btn-secondary-dark p-3.5 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              title="Copy referral link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center mt-3">
            Pick one chat or many in Telegram; your invite goes to all of them.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="glass-card rounded-2xl p-4 grid grid-cols-3 divide-x divide-neutral-200 dark:divide-white/5 text-center transition-colors">
        <div>
          <span className="text-[9px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-0.5">Earned</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
            +{formatPoints(totalEarned)} PTS
          </span>
        </div>

        <div>
          <span className="text-[9px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-0.5">Friends</span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">{friendsCount}</span>
        </div>

        <div>
          <span className="text-[9px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-0.5">Active</span>
          <span className="text-sm font-bold text-green-500 font-mono">{activeCount}</span>
        </div>
      </div>

      {/* Invite Link Input */}
      <div className="glass-card rounded-2xl p-3.5 transition-colors">
        <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1.5">
          Your Invite Link
        </span>
        <div className="flex items-center justify-between rounded-xl bg-neutral-100 dark:bg-neutral-900/80 px-3 py-2 border border-neutral-200 dark:border-white/5">
          <span className="text-xs text-neutral-700 dark:text-neutral-300 font-mono truncate mr-2">{inviteLink}</span>
          <button onClick={handleCopy} className="text-neutral-400 hover:text-black dark:hover:text-white shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* How it pays Steps */}
      <div className="glass-card rounded-3xl p-5 transition-colors">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">How it pays</h3>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Share your link</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">In any chat, channel or group</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">They join</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">+400 to you • +500 to them</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">They win 5 games</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">+500 active bonus to you</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs">
              ∞
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">You keep earning</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">2% of everything they earn, for life</p>
            </div>
          </div>
        </div>
      </div>

      {/* Friends List or Empty State */}
      <div className="glass-card rounded-3xl p-5 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Your friends</h3>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{friends.length}</span>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-400 font-mono text-xl">
              [+]
            </div>
            <p className="text-xs font-bold text-neutral-900 dark:text-white">No friends yet</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
              Share your link: you get +400 the moment someone joins.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100 dark:bg-[#141418] border border-neutral-200 dark:border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-neutral-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-neutral-900 dark:text-white">
                    {f.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white">{f.name}</p>
                    <span className="text-[10px] text-neutral-500">
                      {formatISTDateTime(f.joinedAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      f.isActive ? 'bg-green-500/20 text-green-500' : 'bg-neutral-200 dark:bg-white/5 text-neutral-500'
                    }`}
                  >
                    {f.isActive ? 'Active (+500)' : 'Joined (+400)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
