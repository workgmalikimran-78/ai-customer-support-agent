import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SparklineCard } from '@/components/metrics/SparklineCard';
import { GaugeCard } from '@/components/metrics/GaugeCard';
import { MiniSentimentCard } from '@/components/metrics/MiniSentimentCard';
import { BotFlowCanvas } from '@/features/bot-builder/components/BotFlowCanvas';
import { useBotFlow } from '@/features/bot-builder/hooks/useBotFlow';
import { useAnalyticsMetrics } from '@/features/analytics/hooks/useAnalyticsMetrics';
import { useFlowBuilderStore } from '@/features/bot-builder/store/flowBuilderStore';
import styles from './ChatbotBuilderPage.module.css';

export default function ChatbotBuilderPage() {
  const { isLoading, save, isSaving, publish, isPublishing } = useBotFlow();
  const { data: metrics } = useAnalyticsMetrics();
  const isDirty = useFlowBuilderStore((s) => s.isDirty);

  return (
    <div>
      <PageHeader
        title="Chatbot Builder"
        subtitle="Design and monitor your AI conversation flows."
        action={
          <div className={styles.actionRow}>
            <Button variant="secondary" onClick={() => save()} disabled={isSaving || !isDirty}>
              {isSaving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button variant="primary" onClick={() => publish()} disabled={isPublishing}>
              {isPublishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        }
      />

      {metrics && (
        <>
          <h2 className={styles.sectionTitle}>Live Performance Metrics</h2>
          <div className={styles.metricsGrid}>
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
        </>
      )}

      <h2 className={styles.sectionTitle}>Bot Flow Designer</h2>
      {isLoading ? (
        <div className={styles.loading}>Loading flow…</div>
      ) : (
        <BotFlowCanvas />
      )}
    </div>
  );
}
