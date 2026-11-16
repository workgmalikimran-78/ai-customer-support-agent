import { ChatPanel } from '@/features/webchat/components/ChatPanel';
import styles from './WebChatWidgetPage.module.css';

export default function WebChatWidgetPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.panelWrapper}>
        <ChatPanel />
      </div>
    </div>
  );
}
