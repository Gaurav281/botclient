import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setActiveTelegramId } from '../services/api';
import {
  initTelegramApp,
  getTelegramInitData,
  getTelegramUser,
  getStartParamReferral,
  triggerHaptic,
} from '../services/telegram';
import { sound } from '../services/audio';

const GameContext = createContext(null);

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'tasks', 'arena', 'refer', 'wallet'
  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] = useState('normal'); // 'easy', 'normal', 'hard'
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showBossVictoryModal, setShowBossVictoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [lastGameResult, setLastGameResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Theme Management (Dark / Light Mode)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ast_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('ast_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    triggerHaptic('light');
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    if (type === 'success') triggerHaptic('success');
    else if (type === 'error') triggerHaptic('error');
    else triggerHaptic('light');

    setTimeout(() => {
      setToast((prev) => (prev && prev.message === message ? null : prev));
    }, 3500);
  }, []);

  // Lock body scroll whenever playing to ensure 100% viewport fit
  useEffect(() => {
    if (isPlaying) {
      document.body.classList.add('in-game-lock');
    } else {
      document.body.classList.remove('in-game-lock');
    }
    return () => {
      document.body.classList.remove('in-game-lock');
    };
  }, [isPlaying]);

  // Initialize Telegram & Authenticate with real user credentials
  const initAuth = useCallback(async () => {
    try {
      setLoading(true);
      initTelegramApp();

      const initData = getTelegramInitData();
      const tgUser = getTelegramUser();
      const refCode = getStartParamReferral();

      // Only if outside Telegram, use a persistent local player ID
      let devUser = null;
      if (!tgUser && !initData) {
        let storedId = localStorage.getItem('ast_pilot_id');
        if (!storedId) {
          storedId = 'pilot_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('ast_pilot_id', storedId);
        }
        devUser = {
          id: storedId,
          firstName: 'Player',
          lastName: '',
          username: '',
          photoUrl: '',
        };
      }

      const loginRes = await api.loginTelegram({
        initData,
        devUser,
        referralCode: refCode,
      });

      if (loginRes.success && loginRes.user) {
        setActiveTelegramId(loginRes.user.telegramId);
        setUser(loginRes.user);
        sound.setEnabled(loginRes.user.soundEnabled ?? true);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      showToast('Error connecting to game server: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Refresh latest user stats
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Failed refreshing user data:', err);
    }
  }, []);

  // Launch Asteroid Blaster Game Flow (Unlimited Plays)
  const launchGame = useCallback((chosenDifficulty = 'normal') => {
    if (!user) return;

    // Check boss pending lock
    if (user.bossKillPendingClaim) {
      showToast('Watch ad to claim your 200 Boss Coins before starting next game!', 'warning');
      setShowBossVictoryModal(true);
      return;
    }

    setDifficulty(chosenDifficulty);

    // Check if user chose "Do not show rules again"
    if (!user.doNotShowRules) {
      setShowRulesModal(true);
    } else {
      setIsPlaying(true);
    }
  }, [user, showToast]);

  const confirmStartGame = useCallback(async () => {
    try {
      setShowRulesModal(false);
      const res = await api.startGame();
      if (res.success) {
        setIsPlaying(true);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast]);

  // Handle Game Finish
  const handleGameEnd = useCallback(async (resultData) => {
    setIsPlaying(false);
    setLastGameResult(resultData);

    try {
      const res = await api.finishGame({
        score: resultData.score,
        enemiesKilled: resultData.kills,
        bossKilled: resultData.bossKilled,
        difficulty,
      });

      if (res.success && res.user) {
        setUser(res.user);
      }

      if (resultData.bossKilled) {
        setShowBossVictoryModal(true);
      } else {
        setShowGameOverModal(true);
      }
    } catch (err) {
      console.error('Error saving game finish:', err);
      showToast('Error saving score: ' + err.message, 'error');
      setShowGameOverModal(true);
    }
  }, [difficulty, showToast]);

  const switchTab = useCallback((tab) => {
    triggerHaptic('selection');
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Admin authorization is computed securely on the backend
  const isAdmin = Boolean(user?.isAdmin);

  return (
    <GameContext.Provider
      value={{
        user,
        setUser,
        isAdmin,
        loading,
        theme,
        toggleTheme,
        activeTab,
        switchTab,
        isPlaying,
        setIsPlaying,
        difficulty,
        setDifficulty,
        showRulesModal,
        setShowRulesModal,
        showGameOverModal,
        setShowGameOverModal,
        showBossVictoryModal,
        setShowBossVictoryModal,
        showProfileModal,
        setShowProfileModal,
        showAdminModal,
        setShowAdminModal,
        lastGameResult,
        launchGame,
        confirmStartGame,
        handleGameEnd,
        refreshUser,
        showToast,
        toast,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
