import clsx from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { relativeTimeFromNow } from '@/utils/time';
import type { Conversation } from '../types/inbox';
import { ChannelBadgeIcon, getChannelLabel } from './ChannelBadgeIcon';
import styles from './ConversationListItem.module.css';

interface ConversationListItemProps {
  conversation: Conversation;
  active?: boolean;
  onClick?: () => void;
}

export function ConversationListItem({ conversation, active, onClick }: ConversationListItemProps) {
  return (
    <button
      type="button"
      className={clsx(styles.row, active && styles.active)}
      onClick={onClick}
    >
      <Avatar
        name={conversation.contactName}
        size="md"
        badge={<ChannelBadgeIcon channel={conversation.channel} />}
      />
      <div className={styles.body}>
        <div className={styles.topLine}>
          <span className={styles.name}>{conversation.contactName}</span>
          <span className={styles.time}>{relativeTimeFromNow(conversation.lastMessageAt)}</span>
        </div>
        <div className={styles.channelLabel}>{getChannelLabel(conversation.channel)}</div>
        <div className={styles.preview}>{conversation.lastMessagePreview}</div>
      </div>
      {conversation.unreadCount > 0 && (
        <span className={styles.unreadDot}>{conversation.unreadCount}</span>
      )}
    </button>
  );
}
