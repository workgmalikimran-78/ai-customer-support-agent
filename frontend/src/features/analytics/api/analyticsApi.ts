import httpClient from '@/api/httpClient';
import type { AnalyticsMetrics } from '../types/analytics';
import { MOCK_ANALYTICS } from './mockAnalytics';

export async function fetchAnalyticsMetrics(teamId: string): Promise<AnalyticsMetrics> {
  try {
    const { data } = await httpClient.get<AnalyticsMetrics>(`/api/analytics/${teamId}/metrics`);
    return data;
  } catch (err) {
    console.warn('[analyticsApi] fetchAnalyticsMetrics falling back to mock data:', err);
    return structuredClone(MOCK_ANALYTICS);
  }
}
