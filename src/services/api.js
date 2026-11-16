const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let activeTelegramId = localStorage.getItem('ast_tg_id') || '';

export function setActiveTelegramId(id) {
  activeTelegramId = String(id);
  localStorage.setItem('ast_tg_id', activeTelegramId);
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (activeTelegramId) {
    headers['x-telegram-id'] = activeTelegramId;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

export const api = {
  loginTelegram: (payload) => request('/auth/telegram', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  updatePreferences: (prefs) => request('/auth/preferences', { method: 'PATCH', body: JSON.stringify(prefs) }),

  // Game
  startGame: () => request('/game/start', { method: 'POST' }),
  finishGame: (data) => request('/game/finish', { method: 'POST', body: JSON.stringify(data) }),
  claimBossReward: () => request('/game/claim-boss-reward', { method: 'POST' }),
  getLiveTicker: () => request('/game/live-ticker'),

  // Wallet
  getWalletSummary: () => request('/wallet/summary'),
  getWeeklyGraph: () => request('/wallet/weekly-graph'),
  convertPoints: (pointsToConvert) => request('/wallet/convert', { method: 'POST', body: JSON.stringify({ pointsToConvert }) }),
  submitWithdrawal: (upiId, amountInr) => request('/wallet/withdraw', { method: 'POST', body: JSON.stringify({ upiId, amountInr }) }),
  redeemPromoCode: (code) => request('/wallet/redeem-promo', { method: 'POST', body: JSON.stringify({ code }) }),

  // Tasks
  getTasks: () => request('/tasks'),
  startTask: (id) => request(`/tasks/${id}/start`, { method: 'POST' }),
  claimTask: (id) => request(`/tasks/${id}/claim`, { method: 'POST' }),
  dailyCheckIn: () => request('/tasks/checkin', { method: 'POST' }),

  // Referral
  getReferral: () => request('/referral'),

  // Admin Panel APIs
  getAdminOverview: () => request('/admin/overview'),
  getAdminWithdrawals: (status) => request(`/admin/withdrawals${status ? `?status=${status}` : ''}`),
  approveWithdrawal: (id, transactionRef) => request(`/admin/withdrawals/${id}/approve`, { method: 'POST', body: JSON.stringify({ transactionRef }) }),
  rejectWithdrawal: (id, reason) => request(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getAdminPromoCodes: () => request('/admin/promo-codes'),
  createAdminPromoCode: (payload) => request('/admin/promo-codes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAdminPromoCode: (id) => request(`/admin/promo-codes/${id}`, { method: 'DELETE' }),
  getAdminCategories: () => request('/admin/categories'),
  updateAdminCategory: (category, enabled) => request('/admin/categories', { method: 'POST', body: JSON.stringify({ category, enabled }) }),
};
