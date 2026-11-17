import { create } from 'zustand';
import { api, setActiveTelegramId } from '../services/api';
import {
  initTelegramApp,
  getTelegramInitData,
  getTelegramUser,
  getStartParamReferral,
  triggerHaptic,
} from '../services/telegram';
import { sound } from '../services/audio';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  theme: localStorage.getItem('ast_theme') || 'dark',
  soundEnabled: true,
  toast: null,
  showProfileModal: false,

  setUser: (user) => {
    set({ user });
    if (user?.telegramId) {
      setActiveTelegramId(user.telegramId);
    }
  },

  setShowProfileModal: (show) => set({ showProfileModal: show }),

  setTheme: (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('ast_theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    triggerHaptic('light');
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  setSoundEnabled: (enabled) => {
    sound.setEnabled(enabled);
    set({ soundEnabled: enabled });
  },

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    if (type === 'success') triggerHaptic('success');
    else if (type === 'error') triggerHaptic('error');
    else triggerHaptic('light');

    setTimeout(() => {
      if (get().toast?.message === message) {
        set({ toast: null });
      }
    }, 3500);
  },

  initAuth: async () => {
    try {
      set({ loading: true });
      initTelegramApp();

      const initData = getTelegramInitData();
      const tgUser = getTelegramUser();
      const refCode = getStartParamReferral();

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
        sound.setEnabled(loginRes.user.soundEnabled ?? true);
        set({
          user: loginRes.user,
          soundEnabled: loginRes.user.soundEnabled ?? true,
        });
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      get().showToast('Error connecting to game server: ' + err.message, 'error');
    } finally {
      set({ loading: false });
    }
  },

  refreshUser: async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        set({ user: res.user });
      }
    } catch (err) {
      console.warn('Failed refreshing user data:', err);
    }
  },
}));

// Helper selector for Admin check
export const selectIsAdmin = (state) => {
  const user = state.user;
  const adminId = String(import.meta.env.VITE_ADMIN_TELEGRAM_ID || '5802486388').trim();
  const adminUsername = String(import.meta.env.VITE_ADMIN_USERNAME || 'Gaurav_281').toLowerCase().replace('@', '').trim();
  const userUsername = String(user?.username || '').toLowerCase().replace('@', '').trim();
  const userTgId = String(user?.telegramId || '').trim();

  return Boolean(
    user?.isAdmin ||
    userTgId === adminId ||
    (userUsername && userUsername === adminUsername)
  );
};
