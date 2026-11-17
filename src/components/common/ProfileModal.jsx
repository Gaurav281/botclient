import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { X, Sun, Moon, Shield, Award, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { formatISTDateTime, formatPoints } from '../../utils/formatters';

export default function ProfileModal() {
  const navigate = useNavigate();
  const { user, showProfileModal, setShowProfileModal, theme, toggleTheme, isAdmin } = useGame();

  if (!showProfileModal) return null;

  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'P';
  const name = user?.firstName || 'Player';
  const username = user?.username ? `@${user.username}` : 'No username';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#121216] border border-neutral-200 dark:border-white/10 p-6 text-neutral-900 dark:text-white shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/5">
          <span className="text-xs uppercase font-mono tracking-widest text-neutral-400">Player Profile</span>
          <button
            onClick={() => setShowProfileModal(false)}
            className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Avatar & Info */}
        <div className="text-center my-5">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 font-black text-black text-2xl shadow-xl">
            {initial}
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white">{name}</h3>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">{username}</p>
        </div>

        {/* Profile Stats Grid */}
        <div className="grid grid-cols-2 gap-2 my-4 text-left">
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              High Score
            </span>
            <span className="text-base font-extrabold text-neutral-900 dark:text-white font-mono">
              {formatPoints(user?.highScore || 0)}
            </span>
          </div>

          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-900/90 p-3 border border-neutral-200 dark:border-white/5">
            <span className="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400 block mb-1">
              Enemies Blasted
            </span>
            <span className="text-base font-extrabold text-neutral-900 dark:text-white font-mono">
              {formatPoints(user?.totalKills || 0)}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 mb-5">
          {user?.savedUpiId && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/5">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                <span>Saved UPI</span>
              </span>
              <span className="font-mono text-neutral-900 dark:text-white font-semibold">
                {user.savedUpiId}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Joined</span>
            </span>
            <span className="font-mono text-neutral-900 dark:text-white font-medium">
              {formatISTDateTime(user?.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/5">
            <span>Theme Mode</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-white" /> : <Sun className="w-3.5 h-3.5 text-black stroke-[2.2]" />}
              <span className="capitalize text-xs">{theme}</span>
            </button>
          </div>
          {isAdmin && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
              <span className="flex items-center gap-1.5 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>Admin Mode</span>
              </span>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  navigate('/admin/withdrawals');
                }}
                className="px-3 py-1 rounded-full bg-red-500 text-white font-mono text-xs font-black shadow-md hover:bg-red-600 active:scale-95 transition-all"
              >
                Open Admin Console
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowProfileModal(false)}
          className="w-full btn-primary-white py-3 rounded-2xl text-xs font-bold shadow-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}
