export interface SparklinePoint {
  x: string | number;
  y: number;
}

export interface ResponseTimeByDay {
  day: string;
  seconds: number;
}

export type AlertSeverity = 'warning' | 'success' | 'info';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string; // ISO
}

export interface AnalyticsMetrics {
  activeSessions: {
    current: number;
    peak: number;
    trendLabel: string;
    series: SparklinePoint[];
  };
  aiResolutionRate: {
    percent: number;
    target: number;
  };
  avgResponseTime: {
    series: ResponseTimeByDay[];
    averageSeconds: number;
  };
  customerSentiment: {
    score: number; // -100..100
    emoji: string;
    description: string;
    series: SparklinePoint[];
  };
  alerts: AlertItem[];
}
