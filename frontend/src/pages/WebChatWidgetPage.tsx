import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useWebChat } from '@/features/webchat/hooks/useWebChat';
import styles from './WebChatWidgetPage.module.css';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function WebChatWidgetPage() {
  const { messages, send, isSending, error } = useWebChat();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || isSending) return;
    const succeeded = await send(draft);
    if (succeeded) setDraft('');
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card} padding="none">
        <div className={styles.header}>
          <div className={styles.headerTitle}>Smartify Support</div>
          <div className={styles.headerSubtitle}>We typically reply in a few minutes</div>
        </div>

        <div className={styles.thread} ref={scrollRef}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>Send a message to start the conversation.</div>
          )}
          {messages.map((m) => {
            const isCustomer = m.sender === 'CUSTOMER';
            return (
              <div key={m.id} className={isCustomer ? styles.rowRight : styles.rowLeft}>
                <div className={isCustomer ? styles.bubbleCustomer : styles.bubbleOther}>
                  {m.content}
                </div>
                <span className={styles.timestamp}>{formatTime(m.createdAt)}</span>
              </div>
            );
          })}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.composer} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="Type your message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={isSending}
          />
          <Button type="submit" variant="primary" disabled={isSending || !draft.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
