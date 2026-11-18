import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { BotFlowCanvas } from '@/features/bot-builder/components/BotFlowCanvas';
import { useBotFlow } from '@/features/bot-builder/hooks/useBotFlow';
import { useFlowBuilderStore } from '@/features/bot-builder/store/flowBuilderStore';
import styles from './ChatbotBuilderPage.module.css';

export default function ChatbotBuilderPage() {
  const { isLoading, save, isSaving, publish, isPublishing, validationErrors } = useBotFlow();
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

      <h2 className={styles.sectionTitle}>Bot Flow Designer</h2>
      {validationErrors && validationErrors.length > 0 && (
        <div className={styles.validationBanner}>
          This flow can't be published yet:
          <ul>
            {validationErrors.map((error, index) => (
              <li key={`${error.nodeId}-${index}`}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
      {isLoading ? (
        <div className={styles.loading}>Loading flow…</div>
      ) : (
        <BotFlowCanvas />
      )}
    </div>
  );
}
