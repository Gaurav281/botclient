import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds fresh cache
      gcTime: 1000 * 60 * 10, // 10 minutes in memory
      refetchOnWindowFocus: false, // Avoid intrusive refetches inside Telegram Mini App
      retry: 1,
    },
  },
});
