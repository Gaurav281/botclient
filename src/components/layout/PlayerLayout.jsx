import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNavbar from './BottomNavbar';
import ProfileModal from '../common/ProfileModal';
import JoinChannelsGateModal from '../common/JoinChannelsGateModal';
import GameRulesModal from '../game/GameRulesModal';
import GameOverModal from '../game/GameOverModal';
import BossVictoryModal from '../game/BossVictoryModal';
import Toast from '../common/Toast';

export default function PlayerLayout() {
  const location = useLocation();
  const isGameDetailPage = location.pathname.startsWith('/arena/') && location.pathname !== '/arena';

  return (
    <div className="h-[100dvh] h-screen app-dotted-bg text-neutral-900 dark:text-white flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden transition-colors font-sans">
      {!isGameDetailPage && <Header />}

      <main className={`flex-1 min-h-0 ${isGameDetailPage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        <Outlet />
      </main>

      {!isGameDetailPage && <BottomNavbar />}

      {/* Global Modals */}
      <ProfileModal />
      <JoinChannelsGateModal />
      <GameRulesModal />
      <GameOverModal />
      <BossVictoryModal />
      <Toast />
    </div>
  );
}
