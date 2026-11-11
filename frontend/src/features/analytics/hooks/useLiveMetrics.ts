import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IMessage } from '@stomp/stompjs';
import socketClient from '@/api/socketClient';
import { useAuthStore } from '@/store/authStore';
import type { AnalyticsMetrics } from '../types/analytics';

/**
 * Subscribes to `/topic/metrics/{teamId}` and merges any pushed updates into
 * the React Query cache for `['analytics-metrics', teamId]`. Safe to mount
 * even when no WebSocket backend is available - `socketClient` swallows
 * connection errors internally.
 */
export function useLiveMetrics() {
  const teamId = useAuthStore((s) => s.user.teamId);
  const queryClient = useQueryClient();

  useEffect(() => {
    const topic = `/topic/metrics/${teamId}`;

    const handleMessage = (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body) as Partial<AnalyticsMetrics>;
        queryClient.setQueryData<AnalyticsMetrics | undefined>(
          ['analytics-metrics', teamId],
          (prev) => (prev ? { ...prev, ...payload } : prev),
        );
      } catch (err) {
        console.warn('[useLiveMetrics] failed to parse metrics message:', err);
      }
    };

    const unsubscribe = socketClient.subscribe(topic, handleMessage);
    return () => unsubscribe();
  }, [teamId, queryClient]);
}
