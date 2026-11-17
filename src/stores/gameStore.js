import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './authStore';

export const useGameStore = create((set, get) => ({
  isPlaying: false,
  difficulty: 'normal',
  showRulesModal: false,
  showGameOverModal: false,
  showBossVictoryModal: false,
  lastGameResult: null,

  setIsPlaying: (playing) => {
    if (playing) {
      document.body.classList.add('in-game-lock');
    } else {
      document.body.classList.remove('in-game-lock');
    }
    set({ isPlaying: playing });
  },

  setDifficulty: (difficulty) => set({ difficulty }),
  setShowRulesModal: (show) => set({ showRulesModal: show }),
  setShowGameOverModal: (show) => set({ showGameOverModal: show }),
  setShowBossVictoryModal: (show) => set({ showBossVictoryModal: show }),
  setLastGameResult: (result) => set({ lastGameResult: result }),

  launchGame: (chosenDifficulty = 'normal') => {
    const user = useAuthStore.getState().user;
    const showToast = useAuthStore.getState().showToast;

    if (!user) return;

    if (user.bossKillPendingClaim) {
      showToast('Watch ad to claim your 200 Boss Coins before starting next game!', 'warning');
      set({ showBossVictoryModal: true });
      return;
    }

    set({ difficulty: chosenDifficulty });

    if (!user.doNotShowRules) {
      set({ showRulesModal: true });
    } else {
      get().setIsPlaying(true);
    }
  },

  confirmStartGame: async () => {
    const showToast = useAuthStore.getState().showToast;
    try {
      set({ showRulesModal: false });
      const res = await api.startGame();
      if (res.success) {
        get().setIsPlaying(true);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  handleGameEnd: async (resultData) => {
    get().setIsPlaying(false);
    set({ lastGameResult: resultData });

    const difficulty = get().difficulty;
    const { setUser, showToast } = useAuthStore.getState();

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
        set({ showBossVictoryModal: true });
      } else {
        set({ showGameOverModal: true });
      }
    } catch (err) {
      console.error('Error saving score:', err);
      showToast('Error saving score: ' + err.message, 'error');
      set({ showGameOverModal: true });
    }
  },
}));
