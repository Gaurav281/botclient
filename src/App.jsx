import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Header from './components/layout/Header';
import BottomNavbar from './components/layout/BottomNavbar';
import HomeTab from './components/tabs/HomeTab';
import TasksTab from './components/tabs/TasksTab';
import ArenaTab from './components/tabs/ArenaTab';
import ReferTab from './components/tabs/ReferTab';
import WalletTab from './components/tabs/WalletTab';
import AsteroidBlasterCanvas from './components/game/AsteroidBlasterCanvas';
import GameRulesModal from './components/game/GameRulesModal';
import GameOverModal from './components/game/GameOverModal';
import BossVictoryModal from './components/game/BossVictoryModal';
import ProfileModal from './components/common/ProfileModal';
import AdminModal from './components/admin/AdminModal';
import Toast from './components/common/Toast';

function MainApp() {
  const { isPlaying, activeTab, loading, showAdminModal, setShowAdminModal } = useGame();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#070709] text-neutral-900 dark:text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 dark:border-white/20 border-t-black dark:border-t-white" />
          <span className="text-xs uppercase font-mono tracking-widest text-neutral-500 dark:text-neutral-400">
            Loading Fire Fly Play...
          </span>
        </div>
      </div>
    );
  }

  // Active in-game canvas view (100% viewport locked)
  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-[#070709] overflow-hidden select-none">
        <AsteroidBlasterCanvas />
        <Toast />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-dotted-bg text-neutral-900 dark:text-white flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden transition-colors font-sans">
      <Header />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'arena' && <ArenaTab />}
        {activeTab === 'refer' && <ReferTab />}
        {activeTab === 'wallet' && <WalletTab />}
      </main>

      <BottomNavbar />

      {/* Global Dialogs & Modals */}
      <ProfileModal />
      <AdminModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <GameRulesModal />
      <GameOverModal />
      <BossVictoryModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}
