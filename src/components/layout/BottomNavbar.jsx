import React from 'react';
import { useGame } from '../../context/GameContext';
import { Home, CheckSquare, Gamepad2, Users, Wallet } from 'lucide-react';

export default function BottomNavbar() {
  const { activeTab, switchTab } = useGame();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: '6' },
    { id: 'arena', label: 'Arena', icon: Gamepad2, isPill: true },
    { id: 'refer', label: 'Refer', icon: Users },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0c0c0f]/95 backdrop-blur-xl border-t border-neutral-200 dark:border-white/10 px-4 py-2 pb-5 sm:pb-2 transition-colors shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Center Elevated Pill Button for Arena
          if (item.isPill) {
            return (
              <button
                key={item.id}
                onClick={() => switchTab(item.id)}
                className="flex flex-col items-center group -mt-1 active:scale-95 transition-transform"
              >
                <div
                  className={`flex h-8 px-4 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                      : 'bg-neutral-100 text-neutral-800 dark:bg-[#1b1b22] dark:text-white hover:bg-neutral-200 dark:hover:bg-[#262630] border border-neutral-200 dark:border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  <span className="text-xs font-black font-mono">Play</span>
                </div>
                <span
                  className={`text-[10px] mt-1 font-semibold transition-colors ${
                    isActive ? 'text-black dark:text-white font-black' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => switchTab(item.id)}
              className="relative flex flex-col items-center py-1 px-3 transition-colors active:scale-95"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-black dark:text-white' : 'text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-neutral-300'
                  }`}
                />
                {item.badge && !isActive && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-black px-1 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold transition-colors ${
                  isActive ? 'text-black dark:text-white font-black' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
