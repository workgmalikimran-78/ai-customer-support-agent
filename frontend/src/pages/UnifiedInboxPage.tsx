import { useEffect, useMemo, useState } from 'react';
import { FilterIcon, PaperclipIcon, SearchIcon, SendIcon, ChevronDownIcon } from '@/components/icons/Icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ConversationListItem } from '@/features/inbox/components/ConversationListItem';
import { ChannelBadgeIcon, getChannelLabel } from '@/features/inbox/components/ChannelBadgeIcon';
import { MessageBubble } from '@/features/inbox/components/MessageBubble';
import { useConversations } from '@/features/inbox/hooks/useConversations';
import { useMessages, useSendMessage } from '@/features/inbox/hooks/useMessages';
import { useInboxSocket } from '@/features/inbox/hooks/useInboxSocket';
import type { ConversationStatus } from '@/features/inbox/types/inbox';
import styles from './UnifiedInboxPage.module.css';

const STATUS_TONE: Record<ConversationStatus, 'green' | 'yellow' | 'purple'> = {
  open: 'purple',
  pending: 'yellow',
  resolved: 'green',
};

export default function UnifiedInboxPage() {
  const { data: conversations, isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');

  useInboxSocket(selectedId);

  useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.contactName.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const selectedConversation = conversations?.find((c) => c.id === selectedId) ?? null;
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedId);
  const sendMessageMutation = useSendMessage(selectedId);

  function handleSend() {
    const text = draft.trim();
    if (!text || !selectedId) return;
    sendMessageMutation.mutate(text);
    setDraft('');
  }

  return (
    <div className={styles.wrapper}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={styles.leftPanelHeader}>
          <h2 className={styles.panelTitle}>AI Inbox</h2>
          <button type="button" className={styles.filterButton} aria-label="Filter conversations">
            <FilterIcon size={16} />
          </button>
        </div>
        <div className={styles.searchRow}>
          <Input
            placeholder="Search conversations…"
            leftIcon={<SearchIcon size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.convoScroll}>
          {isLoading && <div className={styles.emptyNote}>Loading conversations…</div>}
          {!isLoading && filteredConversations.length === 0 && (
            <div className={styles.emptyNote}>No conversations match your search.</div>
          )}
          {filteredConversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === selectedId}
              onClick={() => setSelectedId(conversation.id)}
            />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        {!selectedConversation && (
          <div className={styles.emptyRight}>Select a conversation to get started.</div>
        )}

        {selectedConversation && (
          <>
            <div className={styles.threadHeader}>
              <div className={styles.threadHeaderLeft}>
                <Avatar
                  name={selectedConversation.contactName}
                  size="md"
                  badge={<ChannelBadgeIcon channel={selectedConversation.channel} />}
                />
                <div>
                  <div className={styles.contactName}>{selectedConversation.contactName}</div>
                  <div className={styles.channelName}>
                    {getChannelLabel(selectedConversation.channel)}
                  </div>
                </div>
              </div>
              <button type="button" className={styles.statusDropdown}>
                <Badge tone={STATUS_TONE[selectedConversation.status]} dot>
                  {selectedConversation.status}
                </Badge>
                <ChevronDownIcon size={14} />
              </button>
            </div>

            <div className={styles.threadScroll}>
              {messagesLoading && <div className={styles.emptyNote}>Loading messages…</div>}
              {messages?.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>

            <div className={styles.composer}>
              <button type="button" className={styles.attachButton} aria-label="Attach file">
                <PaperclipIcon size={18} />
              </button>
              <input
                className={styles.composerInput}
                placeholder="Type your reply…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <Button variant="primary" size="md" onClick={handleSend} rightIcon={<SendIcon size={15} />}>
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
