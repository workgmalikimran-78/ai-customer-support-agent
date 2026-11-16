import { useState } from 'react';
import { ChatPanel } from './ChatPanel';
import styles from './ChatWidgetLauncher.module.css';

/**
 * Floating chat bubble docked to the right side of the viewport, persistent across
 * navigation wherever it's mounted (e.g. ShopLayout, so it's visible on every /shop/* page).
 * Renders the same ChatPanel the full-page /widget route uses -- same conversation, same
 * localStorage-persisted identity, just a different host.
 */
export function ChatWidgetLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.dock}>
      {isOpen && (
        <div className={styles.panelWrapper}>
          <ChatPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
