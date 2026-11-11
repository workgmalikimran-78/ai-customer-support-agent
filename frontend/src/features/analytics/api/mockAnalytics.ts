import type { AnalyticsMetrics } from '../types/analytics';

export const MOCK_ANALYTICS: AnalyticsMetrics = {
  activeSessions: {
    current: 482,
    peak: 610,
    trendLabel: '+12.4%',
    series: [
      { x: '9am', y: 210 },
      { x: '10am', y: 260 },
      { x: '11am', y: 340 },
      { x: '12pm', y: 390 },
      { x: '1pm', y: 420 },
      { x: '2pm', y: 460 },
      { x: '3pm', y: 482 },
    ],
  },
  aiResolutionRate: {
    percent: 78,
    target: 85,
  },
  avgResponseTime: {
    averageSeconds: 14,
    series: [
      { day: 'Mon', seconds: 18 },
      { day: 'Tue', seconds: 15 },
      { day: 'Wed', seconds: 12 },
      { day: 'Thu', seconds: 16 },
      { day: 'Fri', seconds: 11 },
      { day: 'Sat', seconds: 9 },
    ],
  },
  customerSentiment: {
    score: 42,
    emoji: '🙂',
    description: 'Mostly positive',
    series: [
      { x: 1, y: 20 },
      { x: 2, y: 28 },
      { x: 3, y: 25 },
      { x: 4, y: 35 },
      { x: 5, y: 40 },
      { x: 6, y: 42 },
    ],
  },
  alerts: [
    {
      id: 'alert-1',
      severity: 'warning',
      message: "Spike in 'Refund' queries detected",
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-2',
      severity: 'success',
      message: 'New bot version deployed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-3',
      severity: 'info',
      message: 'Weekly analytics report is ready to view',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'alert-4',
      severity: 'warning',
      message: "AI resolution rate dropped below 80% for 'Billing' intent",
      timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    },
  ],
};
