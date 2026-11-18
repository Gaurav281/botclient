import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';
import PlayerLayout from './components/layout/PlayerLayout';
import AsteroidBlasterCanvas from './components/game/AsteroidBlasterCanvas';
import CarRunnerCanvas from './components/game/CarRunnerCanvas';
import GameOverModal from './components/game/GameOverModal';
import BossVictoryModal from './components/game/BossVictoryModal';
import AppLoadingScreen from './components/common/AppLoadingScreen';
import Toast from './components/common/Toast';

// Code-splitting with React.lazy for high performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TasksPage = React.lazy(() => import('./pages/TasksPage'));
const ArenaPage = React.lazy(() => import('./pages/ArenaPage'));
const AsteroidBlasterPage = React.lazy(() => import('./pages/AsteroidBlasterPage'));
const MiniRacingPage = React.lazy(() => import('./pages/MiniRacingPage'));
const ReferPage = React.lazy(() => import('./pages/ReferPage'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));

const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminTournamentsPage = React.lazy(() => import('./pages/admin/AdminTournamentsPage'));
const AdminWithdrawalsPage = React.lazy(() => import('./pages/admin/AdminWithdrawalsPage'));
const AdminPromoCodesPage = React.lazy(() => import('./pages/admin/AdminPromoCodesPage'));
const AdminCategoriesPage = React.lazy(() => import('./pages/admin/AdminCategoriesPage'));

function PageLoader() {
  return (
    <div className="flex h-64 w-full items-center justify-center text-neutral-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 dark:border-white/20 border-t-black dark:border-t-white" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
          Loading...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const { isPlaying, loading, activeGameType } = useGame();

  if (loading) {
    return <AppLoadingScreen />;
  }

  // Active in-game canvas view (100% viewport locked)
  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-[#070709] overflow-hidden select-none z-50">
        {activeGameType === 'car_runner' ? (
          <CarRunnerCanvas />
        ) : (
          <AsteroidBlasterCanvas />
        )}
        <GameOverModal />
        <BossVictoryModal />
        <Toast />
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Main Player Routes in mobile frame */}
        <Route element={<PlayerLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/arena" element={<ArenaPage />} />
          <Route path="/arena/asteroid-blaster" element={<AsteroidBlasterPage />} />
          <Route path="/arena/mini-racing" element={<MiniRacingPage />} />
          <Route path="/refers" element={<ReferPage />} />
          <Route path="/wallet" element={<WalletPage />} />
        </Route>

        {/* Dedicated Full Admin Console Pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="tournaments" replace />} />
          <Route path="tournaments" element={<AdminTournamentsPage />} />
          <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
