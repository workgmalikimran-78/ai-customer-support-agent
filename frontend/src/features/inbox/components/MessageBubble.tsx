import clsx from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { formatClockTime } from '@/utils/time';
import type { Message } from '../types/inbox';
import styles from './MessageBubble.module.css';

export function MessageBubble({ message }: { message: Message }) {
  const isCustomer = message.sender === 'customer';

  return (
    <div className={clsx(styles.row, isCustomer ? styles.left : styles.right)}>
      {!isCustomer && (
        <div className={styles.aiAvatar}>
          <Avatar name="Smartify AI" size="xs" />
        </div>
      )}
      <div className={styles.bubbleCol}>
        {!isCustomer && <span className={styles.senderLabel}>Smartify AI</span>}
        <div className={clsx(styles.bubble, isCustomer ? styles.bubbleCustomer : styles.bubbleAi)}>
          {message.text}
        </div>
        <span className={styles.timestamp}>{formatClockTime(message.sentAt)}</span>
      </div>
    </div>
  );
}
