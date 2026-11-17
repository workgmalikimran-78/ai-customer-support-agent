import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IMessage } from '@stomp/stompjs';
import socketClient from '@/api/socketClient';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import { fetchWebChatMessages, sendWebChatMessage } from '../api/webchatApi';
import type { WebChatMessage } from '../types/webchat';

const EXTERNAL_ID_KEY = 'smartify_webchat_external_id';
const CONVERSATION_ID_KEY = 'smartify_webchat_conversation_id';
const ANONYMOUS_IDENTITY = 'anonymous';

/**
 * Each distinct identity (a specific logged-in customer, or the anonymous visitor
 * bucket) gets its own externalId/conversationId thread, scoped by identityKey below.
 * Without this, two different customers sharing a browser (or a customer logging out
 * and a different one logging in) would see each other's chat history, since the
 * backend only backfills a null customerId on an existing conversation -- it never
 * reassigns one that's already attributed to someone else.
 */
function getOrCreateExternalId(identityKey: string): string {
  const storageKey = `${EXTERNAL_ID_KEY}:${identityKey}`;
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
  }
  return id;
}

function getStoredConversationId(identityKey: string): string | null {
  return localStorage.getItem(`${CONVERSATION_ID_KEY}:${identityKey}`);
}

function setStoredConversationId(identityKey: string, conversationId: string | null) {
  const storageKey = `${CONVERSATION_ID_KEY}:${identityKey}`;
  if (conversationId) {
    localStorage.setItem(storageKey, conversationId);
  } else {
    localStorage.removeItem(storageKey);
  }
}

/**
 * Drives the customer-facing web chat widget: persists each identity's conversationId
 * across reloads (same browser, same logged-in customer or same anonymous visitor),
 * loads history once a conversation exists, sends new messages, and subscribes to the
 * conversation's WebSocket topic so the bot's reply (sent asynchronously) appears live.
 */
export function useWebChat() {
  const identityKey =
    useCustomerAuthStore((s) => (s.isAuthenticated ? s.customer.id : ANONYMOUS_IDENTITY)) ||
    ANONYMOUS_IDENTITY;

  const externalId = useMemo(() => getOrCreateExternalId(identityKey), [identityKey]);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    getStoredConversationId(identityKey),
  );
  const [messages, setMessages] = useState<WebChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read inside the fetch effect without putting identityKey in its deps -- see below
  // for why that matters.
  const identityKeyRef = useRef(identityKey);
  identityKeyRef.current = identityKey;

  // Identity changed (login, logout, or switching to a different customer) -- drop
  // whatever's currently loaded and pick up this identity's own thread instead.
  useEffect(() => {
    setConversationId(getStoredConversationId(identityKey));
    setMessages([]);
  }, [identityKey]);

  // Deliberately depends on conversationId ALONE, not identityKey too: on the same
  // render where identityKey changes, conversationId in this closure is still the
  // *previous* identity's value (the reset effect above hasn't committed its
  // setConversationId(...) yet) -- if identityKey were in these deps, this effect
  // would re-fire on that stale value and its async response would land after the
  // reset effect's setMessages([]) and repopulate the old identity's messages.
  useEffect(() => {
    if (!conversationId) return;
    fetchWebChatMessages(conversationId)
      .then(setMessages)
      .catch(() => {
        // Conversation may have been deleted server-side; start fresh next send.
        setStoredConversationId(identityKeyRef.current, null);
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
          externalId,
          displayName: 'Website Visitor',
          text: trimmed,
        });

        if (response.conversationId !== conversationId) {
          setStoredConversationId(identityKey, response.conversationId);
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
    [conversationId, externalId, identityKey],
  );

  return { messages, send, isSending, error };
}
