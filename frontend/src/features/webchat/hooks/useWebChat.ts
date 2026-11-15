import { useCallback, useEffect, useRef, useState } from 'react';
import type { IMessage } from '@stomp/stompjs';
import socketClient from '@/api/socketClient';
import { fetchWebChatMessages, sendWebChatMessage } from '../api/webchatApi';
import type { WebChatMessage } from '../types/webchat';

const EXTERNAL_ID_KEY = 'smartify_webchat_external_id';
const CONVERSATION_ID_KEY = 'smartify_webchat_conversation_id';

function getOrCreateExternalId(): string {
  let id = localStorage.getItem(EXTERNAL_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(EXTERNAL_ID_KEY, id);
  }
  return id;
}

/**
 * Drives the customer-facing web chat widget: persists the anonymous visitor's
 * externalId/conversationId across reloads (same browser), loads history once a
 * conversation exists, sends new messages, and subscribes to the conversation's
 * WebSocket topic so the bot's reply (sent asynchronously) appears live.
 */
export function useWebChat() {
  const externalIdRef = useRef(getOrCreateExternalId());
  const [conversationId, setConversationId] = useState<string | null>(
    () => localStorage.getItem(CONVERSATION_ID_KEY),
  );
  const [messages, setMessages] = useState<WebChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    fetchWebChatMessages(conversationId)
      .then(setMessages)
      .catch(() => {
        // Conversation may have been deleted server-side; start fresh next send.
        localStorage.removeItem(CONVERSATION_ID_KEY);
        setConversationId(null);
      });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    const topic = `/topic/conversations/${conversationId}`;
    const unsubscribe = socketClient.subscribe(topic, (frame: IMessage) => {
      try {
        const incoming = JSON.parse(frame.body) as WebChatMessage;
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
      } catch {
        // ignore malformed frame
      }
    });
    return unsubscribe;
  }, [conversationId]);

  /** Returns true on success, false on failure, so callers can decide whether it's
   * safe to clear their draft input (losing a failed send's text forces retyping). */
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      setIsSending(true);
      setError(null);
      try {
        const response = await sendWebChatMessage({
          externalId: externalIdRef.current,
          displayName: 'Website Visitor',
          text: trimmed,
        });

        if (response.conversationId !== conversationId) {
          localStorage.setItem(CONVERSATION_ID_KEY, response.conversationId);
          setConversationId(response.conversationId);
        }
        setMessages((prev) =>
          prev.some((m) => m.id === response.message.id) ? prev : [...prev, response.message],
        );
        return true;
      } catch {
        setError('Could not send your message. Please try again.');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId],
  );

  return { messages, send, isSending, error };
}
