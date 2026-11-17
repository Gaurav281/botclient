import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNavbar from './BottomNavbar';
import ProfileModal from '../common/ProfileModal';
import GameRulesModal from '../game/GameRulesModal';
import GameOverModal from '../game/GameOverModal';
import BossVictoryModal from '../game/BossVictoryModal';
import Toast from '../common/Toast';

export default function PlayerLayout() {
  return (
    <div className="min-h-screen app-dotted-bg text-neutral-900 dark:text-white flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden transition-colors font-sans">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <BottomNavbar />

      {/* Global Modals */}
      <ProfileModal />
      <GameRulesModal />
      <GameOverModal />
      <BossVictoryModal />
      <Toast />
    </div>
  );
}
