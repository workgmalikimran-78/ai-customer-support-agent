import clsx from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { formatClockTime } from '@/utils/time';
import type { Message, MessageSender } from '../types/inbox';
import styles from './MessageBubble.module.css';

const SENDER_LABELS: Record<Exclude<MessageSender, 'customer'>, string> = {
  ai: 'Smartify AI',
  agent: 'Agent',
};

export function MessageBubble({ message }: { message: Message }) {
  const isCustomer = message.sender === 'customer';
  const senderLabel = isCustomer ? null : SENDER_LABELS[message.sender as Exclude<MessageSender, 'customer'>];

  return (
    <div className={clsx(styles.row, isCustomer ? styles.left : styles.right)}>
      {!isCustomer && (
        <div className={styles.aiAvatar}>
          <Avatar name={senderLabel ?? 'Agent'} size="xs" />
        </div>
      )}
      <div className={styles.bubbleCol}>
        {!isCustomer && <span className={styles.senderLabel}>{senderLabel}</span>}
        <div className={clsx(styles.bubble, isCustomer ? styles.bubbleCustomer : styles.bubbleAi)}>
          {message.text}
        </div>
        <span className={styles.timestamp}>{formatClockTime(message.sentAt)}</span>
      </div>
    </div>
  );
}
