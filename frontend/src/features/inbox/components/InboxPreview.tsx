import { useEffect, useMemo, useState } from 'react';
import { PaperclipIcon, SearchIcon, SendIcon } from '@/components/icons/Icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConversationListItem } from './ConversationListItem';
import { MessageBubble } from './MessageBubble';
import { useConversations } from '../hooks/useConversations';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useInboxSocket } from '../hooks/useInboxSocket';
import styles from './InboxPreview.module.css';

const PREVIEW_CONVERSATION_COUNT = 5;

/**
 * Compact at-a-glance version of the Unified Inbox for the Dashboard: a short
 * conversation list plus the active thread, with real sending. Reuses the
 * same hooks/components as the full inbox page at a smaller scale rather
 * than a separate read-only mock, so replies sent here show up live in the
 * real inbox too.
 */
export function InboxPreview() {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  useInboxSocket(selectedId);

  useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const previewConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? (conversations ?? []).filter(
          (c) =>
            c.contactName.toLowerCase().includes(q) ||
            c.lastMessagePreview.toLowerCase().includes(q),
        )
      : (conversations ?? []);
    return filtered.slice(0, PREVIEW_CONVERSATION_COUNT);
  }, [conversations, search]);
  const selectedConversation = conversations?.find((c) => c.id === selectedId) ?? null;
  const { data: messages } = useMessages(selectedId);
  const sendMessageMutation = useSendMessage(selectedId);

  function handleSend() {
    const text = draft.trim();
    if (!text || !selectedId) return;
    sendMessageMutation.mutate(text);
    setDraft('');
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.list}>
        <div className={styles.searchRow}>
          <Input
            placeholder="Search conversations…"
            leftIcon={<SearchIcon size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isLoading && <div className={styles.emptyNote}>Loading…</div>}
        {!isLoading && previewConversations.length === 0 && (
          <div className={styles.emptyNote}>No conversations yet.</div>
        )}
        {previewConversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === selectedId}
            onClick={() => setSelectedId(conversation.id)}
          />
        ))}
      </div>

      <div className={styles.thread}>
        {!selectedConversation && <div className={styles.emptyNote}>Select a conversation.</div>}

        {selectedConversation && (
          <>
            <div className={styles.threadScroll}>
              {messages?.slice(-6).map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
            <div className={styles.composer}>
              <button type="button" className={styles.attachButton} aria-label="Attach file">
                <PaperclipIcon size={16} />
              </button>
              <input
                className={styles.composerInput}
                placeholder="Type a reply…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={sendMessageMutation.isPending}
                rightIcon={<SendIcon size={14} />}
              >
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
