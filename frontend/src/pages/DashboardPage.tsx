import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SparklineCard } from '@/components/metrics/SparklineCard';
import { GaugeCard } from '@/components/metrics/GaugeCard';
import { MiniSentimentCard } from '@/components/metrics/MiniSentimentCard';
import { ResponseTimeBarCard } from '@/components/metrics/ResponseTimeBarCard';
import { SentimentBarCard } from '@/components/metrics/SentimentBarCard';
import { InboxPreview } from '@/features/inbox/components/InboxPreview';
import { BotFlowPreview } from '@/features/bot-builder/components/BotFlowPreview';
import { RecentAlertsPanel } from '@/features/analytics/components/RecentAlertsPanel';
import { useAnalyticsMetrics } from '@/features/analytics/hooks/useAnalyticsMetrics';
import { useLiveMetrics } from '@/features/analytics/hooks/useLiveMetrics';
import { useAuthStore } from '@/store/authStore';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: metrics, isLoading } = useAnalyticsMetrics();
  useLiveMetrics();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        subtitle="Here's how your AI support is performing today."
        action={
          <Link to="/chatbot-builder">
            <Button variant="primary">Open Bot Builder</Button>
          </Link>
        }
      />

      <div className={styles.overviewGrid}>
        <Card padding="none">
          <div className={styles.cardHeaderPad}>
            <CardHeader
              title="Unified Inbox"
              subtitle="Your most recent conversations"
              action={
                <Link to="/inbox">
                  <Button variant="secondary" size="sm">
                    Open Inbox
                  </Button>
                </Link>
              }
            />
          </div>
          <InboxPreview />
        </Card>

        <div className={styles.metricsStack}>
          <div className={styles.sectionLabel}>Live performance metrics</div>
          {!isLoading && metrics && (
            <>
              <div className={styles.metricsRow}>
                <SparklineCard
                  title="Active Sessions"
                  value={metrics.activeSessions.current}
                  trendLabel={metrics.activeSessions.trendLabel}
                  caption={`Peak: ${metrics.activeSessions.peak}`}
                  data={metrics.activeSessions.series}
                />
                <GaugeCard
                  title="AI Resolution Rate"
                  percent={metrics.aiResolutionRate.percent}
                  caption={`Target: ${metrics.aiResolutionRate.target}%`}
                />
              </div>
              <MiniSentimentCard
                title="Customer Sentiment"
                emoji={metrics.customerSentiment.emoji}
                description={metrics.customerSentiment.description}
                data={metrics.customerSentiment.series}
              />
            </>
          )}
        </div>

        <Card padding="none">
          <div className={styles.cardHeaderPad}>
            <CardHeader
              title="Bot Flow Designer"
              subtitle="Your published flow"
              action={
                <Link to="/chatbot-builder">
                  <Button variant="secondary" size="sm">
                    Open Builder
                  </Button>
                </Link>
              }
            />
          </div>
          <BotFlowPreview />
        </Card>

        <div className={styles.analyticsStack}>
          <div className={styles.sectionLabel}>Real-time analytics</div>
          {!isLoading && metrics && (
            <div className={styles.analyticsRow}>
              <ResponseTimeBarCard
                title="Avg Response Time"
                data={metrics.avgResponseTime.series}
                caption={`Average: ${metrics.avgResponseTime.averageSeconds}s`}
              />
              <SentimentBarCard
                title="Customer Sentiment Score"
                score={metrics.customerSentiment.score}
                caption={`${metrics.customerSentiment.emoji} ${metrics.customerSentiment.description}`}
              />
            </div>
          )}
          {!isLoading && metrics && <RecentAlertsPanel alerts={metrics.alerts} />}
        </div>
      </div>
    </div>
  );
}
