import { PageHeader } from '@/components/ui/PageHeader';
import { SparklineCard } from '@/components/metrics/SparklineCard';
import { GaugeCard } from '@/components/metrics/GaugeCard';
import { ResponseTimeBarCard } from '@/components/metrics/ResponseTimeBarCard';
import { SentimentBarCard } from '@/components/metrics/SentimentBarCard';
import { RecentAlertsPanel } from '@/features/analytics/components/RecentAlertsPanel';
import { useAnalyticsMetrics } from '@/features/analytics/hooks/useAnalyticsMetrics';
import { useLiveMetrics } from '@/features/analytics/hooks/useLiveMetrics';
import styles from './AnalyticsPage.module.css';

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalyticsMetrics();
  useLiveMetrics();

  if (isLoading || !data) {
    return <div className={styles.loading}>Loading analytics…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep dive into bot performance, response times, and customer sentiment."
      />

      <div className={styles.grid}>
        <SparklineCard
          title="Active Sessions"
          value={data.activeSessions.current}
          trendLabel={data.activeSessions.trendLabel}
          caption={`Peak: ${data.activeSessions.peak}`}
          data={data.activeSessions.series}
        />
        <GaugeCard
          title="AI Resolution Rate"
          percent={data.aiResolutionRate.percent}
          caption={`Target: ${data.aiResolutionRate.target}%`}
        />
        <ResponseTimeBarCard
          title="Avg Response Time"
          data={data.avgResponseTime.series}
          caption={`Average: ${data.avgResponseTime.averageSeconds}s`}
        />
        <SentimentBarCard
          title="Customer Sentiment Score"
          score={data.customerSentiment.score}
          caption={`${data.customerSentiment.emoji} ${data.customerSentiment.description}`}
        />
      </div>

      <div className={styles.alertsRow}>
        <RecentAlertsPanel alerts={data.alerts} />
      </div>
    </div>
  );
}
