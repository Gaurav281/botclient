import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { Sun, Moon, Sparkles, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, theme, toggleTheme, setShowProfileModal, isAdmin } = useGame();

  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'P';
  const name = user?.firstName || (user?.username ? `@${user.username}` : 'Player');

  // Time-based greeting in IST
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const tabTitles = {
    home: null, // Shows profile avatar & greeting
    tasks: { title: 'Tasks', sub: 'Complete missions & earn PTS' },
    arena: { title: 'Arena', sub: 'Asteroid Blaster mission center' },
    refer: { title: 'Refers', sub: 'Invite friends & earn 2% lifetime' },
    wallet: { title: 'Wallet', sub: 'Points, value & UPI withdrawals' },
  };

  const path = location.pathname;
  const isHome = path === '/home' || path === '/' || path === '';
  const currentKey = path.includes('tasks')
    ? 'tasks'
    : path.includes('arena')
    ? 'arena'
    : path.includes('refer')
    ? 'refer'
    : path.includes('wallet')
    ? 'wallet'
    : 'home';

  const currentTabInfo = tabTitles[currentKey];

  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-2 transition-colors">
      {/* Left side: Profile Avatar ONLY on Home Tab */}
      {isHome ? (
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowProfileModal(true);
          }}
          className="flex items-center gap-3 text-left group transition-all"
        >
          <div className="relative">
            <div className="avatar-header flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 font-black text-black text-xl shadow-md group-hover:scale-105 transition-transform">
              {initial}
            </div>
          </div>

          <div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block -mb-0.5 font-medium">
              {greeting}
            </span>
            <span className="text-lg font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-1.5">
              {name}
            </span>
          </div>
        </button>
      ) : (
        /* Other tabs: Clean Title Header (No profile icon) */
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {currentTabInfo?.title}
          </h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 block -mt-0.5">
            {currentTabInfo?.sub}
          </span>
        </div>
      )}

      {/* Right side: Moon in dark mode, Sun (black, not yellow) in light mode, + Admin button if admin */}
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              navigate('/admin/withdrawals');
            }}
            aria-label="Admin Control Panel"
            className="flex h-10 px-3 items-center justify-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-mono text-xs font-black transition-all active:scale-95 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200/80 dark:bg-white/10 border border-neutral-300 dark:border-white/10 transition-all active:scale-90 shadow-sm"
        >
          {theme === 'purple' ? (
            // In Purple Mode: Show Sparkles icon (violet/purple)
            <Sparkles className="w-5 h-5 text-purple-300 fill-purple-400/20" />
          ) : theme === 'dark' ? (
            // In Dark Mode: Show Moon icon (white)
            <Moon className="w-5 h-5 text-white" />
          ) : (
            // In Light Mode: Show Sun icon (BLACK, not yellow)
            <Sun className="w-5 h-5 text-black stroke-[2.2]" />
          )}
        </button>
      </div>
    </header>
  );
}
