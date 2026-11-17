import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from './context/GameContext';
import PlayerLayout from './components/layout/PlayerLayout';
import AsteroidBlasterCanvas from './components/game/AsteroidBlasterCanvas';
import GameOverModal from './components/game/GameOverModal';
import BossVictoryModal from './components/game/BossVictoryModal';
import Toast from './components/common/Toast';

// Code-splitting with React.lazy for high performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const TasksPage = React.lazy(() => import('./pages/TasksPage'));
const ArenaPage = React.lazy(() => import('./pages/ArenaPage'));
const ReferPage = React.lazy(() => import('./pages/ReferPage'));
const WalletPage = React.lazy(() => import('./pages/WalletPage'));

const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
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
  const { isPlaying, loading } = useGame();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-[#070709] text-neutral-900 dark:text-white font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 dark:border-white/20 border-t-black dark:border-t-white" />
          <span className="text-xs uppercase font-mono tracking-widest text-neutral-500 dark:text-neutral-400">
            Initializing Fire Fly Play...
          </span>
        </div>
      </div>
    );
  }

  // Active in-game canvas view (100% viewport locked)
  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-[#070709] overflow-hidden select-none z-50">
        <AsteroidBlasterCanvas />
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
          <Route path="/refers" element={<ReferPage />} />
          <Route path="/wallet" element={<WalletPage />} />
        </Route>

        {/* Dedicated Full Admin Console Pages */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="withdrawals" replace />} />
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
