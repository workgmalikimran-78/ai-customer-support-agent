import httpClient from '@/api/httpClient';
import type { AlertSeverity, AnalyticsMetrics } from '../types/analytics';

interface MetricSeriesPointDto {
  t: string;
  v: number;
}

interface MetricCardDto {
  current: number;
  target: number | null;
  peak: number | null;
  series: MetricSeriesPointDto[];
}

interface AnalyticsMetricsDto {
  activeSessions: MetricCardDto;
  resolutionRate: MetricCardDto;
  avgResponseTime: MetricCardDto;
  sentiment: MetricCardDto;
}

interface AlertDto {
  id: string;
  severity: string;
  message: string;
  occurredAt: string;
}

const ALERT_SEVERITY_FROM_BACKEND: Record<string, AlertSeverity> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'warning', // frontend has no distinct "critical" tone yet
};

function trendLabel(series: MetricSeriesPointDto[]): string {
  if (series.length < 2) return 'No recent change';
  const first = series[0].v;
  const last = series[series.length - 1].v;
  if (first === 0) return last > 0 ? 'Up from zero' : 'No recent change';
  const pctChange = Math.round(((last - first) / first) * 100);
  if (pctChange === 0) return 'No recent change';
  return pctChange > 0 ? `+${pctChange}% today` : `${pctChange}% today`;
}

function sentimentEmoji(score: number): string {
  if (score >= 40) return '😊';
  if (score <= -20) return '😟';
  return '😐';
}

function sentimentDescription(score: number): string {
  if (score >= 40) return 'Customers are happy';
  if (score <= -20) return 'Customers are frustrated';
  return 'Customer sentiment is steady';
}

function toSparkline(series: MetricSeriesPointDto[]) {
  return series.map((p) => ({ x: p.t, y: p.v }));
}

function toResponseTimeSeries(series: MetricSeriesPointDto[]) {
  return series.map((p) => ({
    day: new Date(p.t).toLocaleDateString(undefined, { weekday: 'short' }),
    seconds: p.v,
  }));
}

export async function fetchAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const [{ data: metrics }, { data: alerts }] = await Promise.all([
    httpClient.get<AnalyticsMetricsDto>('/api/analytics/metrics'),
    httpClient.get<AlertDto[]>('/api/alerts'),
  ]);

  // Conversation.sentimentScore (and by extension this metric) is stored on a -1..1
  // scale; the UI's SentimentBarCard expects -100..100.
  const sentimentScore = Math.round(metrics.sentiment.current * 100);

  return {
    activeSessions: {
      current: metrics.activeSessions.current,
      peak: metrics.activeSessions.peak ?? metrics.activeSessions.current,
      trendLabel: trendLabel(metrics.activeSessions.series),
      series: toSparkline(metrics.activeSessions.series),
    },
    aiResolutionRate: {
      percent: metrics.resolutionRate.current,
      target: metrics.resolutionRate.target ?? 90,
    },
    avgResponseTime: {
      series: toResponseTimeSeries(metrics.avgResponseTime.series),
      averageSeconds: metrics.avgResponseTime.current,
    },
    customerSentiment: {
      score: sentimentScore,
      emoji: sentimentEmoji(sentimentScore),
      description: sentimentDescription(sentimentScore),
      series: toSparkline(metrics.sentiment.series),
    },
    alerts: alerts.map((a) => ({
      id: a.id,
      severity: ALERT_SEVERITY_FROM_BACKEND[a.severity] ?? 'info',
      message: a.message,
      timestamp: a.occurredAt,
    })),
  };
}
