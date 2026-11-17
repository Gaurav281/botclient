import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

// Query Keys
export const queryKeys = {
  walletSummary: ['walletSummary'],
  payoutHistory: ['payoutHistory'],
  weeklyGraph: ['weeklyGraph'],
  tasks: ['tasks'],
  liveTicker: ['liveTicker'],
  adminOverview: ['adminOverview'],
  adminWithdrawals: (status) => ['adminWithdrawals', status || 'all'],
  adminPromoCodes: ['adminPromoCodes'],
  adminCategories: ['adminCategories'],
  tournaments: ['tournaments'],
  adminTournaments: ['adminTournaments'],
};

// ======================== QUERIES ========================

export function useWalletSummaryQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.walletSummary,
    queryFn: () => api.getWalletSummary(),
    enabled: Boolean(user),
    staleTime: 1000 * 20, // 20s
  });
}

export function usePayoutHistoryQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.payoutHistory,
    queryFn: () => api.getPayoutHistory(),
    enabled: Boolean(user),
    staleTime: 1000 * 15,
  });
}

export function useWeeklyGraphQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.weeklyGraph,
    queryFn: () => api.getWeeklyGraph(),
    enabled: Boolean(user),
    staleTime: 1000 * 60, // 1 min
  });
}

export function useTasksQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => api.getTasks(),
    enabled: Boolean(user),
    staleTime: 1000 * 30, // 30s
  });
}

export function useLiveTickerQuery() {
  return useQuery({
    queryKey: queryKeys.liveTicker,
    queryFn: () => api.getLiveTicker(),
    refetchInterval: 1000 * 20, // Refresh every 20s
    staleTime: 1000 * 15,
  });
}

// Admin Queries
export function useAdminOverviewQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: () => api.getAdminOverview(),
    enabled,
    staleTime: 1000 * 15,
  });
}

export function useAdminWithdrawalsQuery(status = 'pending', enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminWithdrawals(status),
    queryFn: () => api.getAdminWithdrawals(status),
    enabled,
    staleTime: 1000 * 15,
  });
}

export function useAdminPromoCodesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminPromoCodes,
    queryFn: () => api.getAdminPromoCodes(),
    enabled,
    staleTime: 1000 * 20,
  });
}

export function useAdminCategoriesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCategories,
    queryFn: () => api.getAdminCategories(),
    enabled,
    staleTime: 1000 * 30,
  });
}

// ======================== MUTATIONS ========================

export function useConvertPointsMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (pointsToConvert) => api.convertPoints(pointsToConvert),
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.walletSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklyGraph });
      showToast(data.message, 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useWithdrawMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ upiId, amountInr }) => api.submitWithdrawal(upiId, amountInr),
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.walletSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.payoutHistory });
      showToast(data.message, 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useRedeemPromoMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (code) => api.redeemPromoCode(code),
    onSuccess: (data) => {
      if (data.user) setUser(data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.walletSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklyGraph });
      showToast(data.message, 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useAdminApproveWithdrawalMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id) => api.approveWithdrawal(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      showToast(data.message || 'Withdrawal approved', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useAdminRejectWithdrawalMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ id, reason }) => api.rejectWithdrawal(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      showToast(data.message || 'Withdrawal rejected and refunded', 'info');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useAdminCreatePromoMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (payload) => api.createAdminPromoCode(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPromoCodes });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      showToast('Promo code created successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useAdminDeletePromoMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id) => api.deleteAdminPromoCode(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPromoCodes });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      showToast(data.message || 'Promo code deleted permanently', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useAdminToggleCategoryMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ category, enabled }) => api.updateAdminCategory(category, enabled),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCategories });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      showToast('Category updated successfully', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

// ======================== TOURNAMENTS ========================

export function useTournamentsQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.tournaments,
    queryFn: () => api.getTournaments(),
    enabled: Boolean(user),
    staleTime: 1000 * 15,
  });
}

export function useAdminTournamentsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminTournaments,
    queryFn: () => api.getAdminTournaments(),
    enabled,
    staleTime: 1000 * 15,
  });
}

export function useJoinTournamentMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (tournamentId) => api.joinTournament(tournamentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      if (data.user) {
        setUser(data.user);
      }
      showToast(data.message || 'Joined tournament successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useCreateAdminTournamentMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (payload) => api.createAdminTournament(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminTournaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      showToast(data.message || 'Tournament created successfully!', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useDeclareAdminTournamentResultsMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id) => api.declareAdminTournamentResults(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminTournaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      showToast(data.message || 'Results declared and prizes distributed!', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}

export function useDeleteAdminTournamentMutation() {
  const queryClient = useQueryClient();
  const showToast = useAuthStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id) => api.deleteAdminTournament(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminTournaments });
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
      showToast(data.message || 'Tournament deleted successfully', 'success');
    },
    onError: (err) => {
      showToast(err.message, 'error');
    },
  });
}
