import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SparklineCard } from '@/components/metrics/SparklineCard';
import { GaugeCard } from '@/components/metrics/GaugeCard';
import { MiniSentimentCard } from '@/components/metrics/MiniSentimentCard';
import { useAnalyticsMetrics } from '@/features/analytics/hooks/useAnalyticsMetrics';
import { useConversations } from '@/features/inbox/hooks/useConversations';
import { relativeTimeFromNow } from '@/utils/time';
import { useAuthStore } from '@/store/authStore';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: metrics, isLoading } = useAnalyticsMetrics();
  const { data: conversations } = useConversations();

  const openConversations = conversations?.filter((c) => c.status !== 'resolved') ?? [];

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

      {!isLoading && metrics && (
        <div className={styles.grid}>
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
          <MiniSentimentCard
            title="Customer Sentiment"
            emoji={metrics.customerSentiment.emoji}
            description={metrics.customerSentiment.description}
            data={metrics.customerSentiment.series}
          />
        </div>
      )}

      <div className={styles.bottomRow}>
        <Card>
          <CardHeader
            title="Needs Attention"
            subtitle={`${openConversations.length} open conversation${
              openConversations.length === 1 ? '' : 's'
            }`}
            action={
              <Link to="/inbox">
                <Button variant="secondary" size="sm">
                  Go to Inbox
                </Button>
              </Link>
            }
          />
          <ul className={styles.convoList}>
            {openConversations.slice(0, 5).map((c) => (
              <li key={c.id} className={styles.convoRow}>
                <span className={styles.convoName}>{c.contactName}</span>
                <span className={styles.convoPreview}>{c.lastMessagePreview}</span>
                <span className={styles.convoTime}>{relativeTimeFromNow(c.lastMessageAt)}</span>
              </li>
            ))}
            {openConversations.length === 0 && (
              <li className={styles.emptyState}>All caught up! No open conversations.</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
