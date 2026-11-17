import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

export default function AddBioLinkModal({
  isOpen,
  onClose,
  onClaim,
  claiming,
  referralCode,
  showToast,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteLink = `https://t.me/FireflyPlayBot?start=${referralCode || 'pilot'}`;

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    if (showToast) showToast('Invite link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-0 animate-fade-in">
      <div className="w-full max-w-md rounded-t-[36px] bg-white dark:bg-[#121216] border-t border-x border-neutral-200 dark:border-white/10 p-6 pb-8 text-neutral-900 dark:text-white shadow-2xl relative transition-colors max-h-[92vh] overflow-y-auto">
        {/* Handle Bar */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-white/20" />

        {/* Header & Close */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
              Add your link to your bio
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Your bio is empty (or hidden).
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="h-9 w-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Stack matching Reference Image 3 */}
        <div className="space-y-3 my-5">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-black shrink-0">
                1
              </span>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Copy your invite link
              </h4>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10">
              <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 truncate select-all">
                {inviteLink}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="h-7 w-7 rounded-lg bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-all text-neutral-700 dark:text-neutral-200"
                title="Copy invite link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-black shrink-0">
                2
              </span>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Paste it into your Telegram bio
              </h4>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-7 leading-relaxed">
              Telegram → Settings → Edit profile (My profile) → Bio. Paste the link and save.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-black shrink-0">
                3
              </span>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Make your bio visible
              </h4>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-7 leading-relaxed">
              Settings → Privacy and Security → Bio → Everybody, so the bot can check it.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-black shrink-0">
                4
              </span>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Come back and claim
              </h4>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-7 leading-relaxed">
              Keep the link in your bio: it&apos;s checked on every check-in.
            </p>
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={onClaim}
          disabled={claiming}
          className="w-full py-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-xl transition-all disabled:opacity-50"
        >
          {claiming ? (
            <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>I&apos;ve added it • Claim</span>
          )}
        </button>
      </div>
    </div>
  );
}
