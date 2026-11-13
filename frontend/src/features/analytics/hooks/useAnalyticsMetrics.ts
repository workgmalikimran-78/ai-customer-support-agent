import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { fetchAnalyticsMetrics } from '../api/analyticsApi';

export function useAnalyticsMetrics() {
  const teamId = useAuthStore((s) => s.user.teamId);

  return useQuery({
    queryKey: ['analytics-metrics', teamId],
    queryFn: () => fetchAnalyticsMetrics(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
