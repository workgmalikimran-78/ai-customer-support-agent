import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IMessage } from '@stomp/stompjs';
import socketClient from '@/api/socketClient';
import { useAuthStore } from '@/store/authStore';
import type { Conversation, Message } from '../types/inbox';

/**
 * Subscribes to `/topic/inbox/{teamId}` for new/updated conversations and
 * `/topic/conversations/{id}` for new messages in the active thread.
 * Gracefully no-ops if the WebSocket backend isn't reachable.
 */
export function useInboxSocket(activeConversationId: string | null) {
  const teamId = useAuthStore((s) => s.user.teamId);
  const queryClient = useQueryClient();

  useEffect(() => {
    const topic = `/topic/inbox/${teamId}`;

    const handleInboxMessage = (message: IMessage) => {
      try {
        const updated = JSON.parse(message.body) as Conversation;
        queryClient.setQueryData<Conversation[] | undefined>(
          ['conversations', teamId],
          (prev) => {
            if (!prev) return prev;
            const idx = prev.findIndex((c) => c.id === updated.id);
            if (idx === -1) return [updated, ...prev];
            const next = [...prev];
            next[idx] = updated;
            return next;
          },
        );
      } catch (err) {
        console.warn('[useInboxSocket] failed to parse inbox message:', err);
      }
    };

    const unsubscribe = socketClient.subscribe(topic, handleInboxMessage);
    return () => unsubscribe();
  }, [teamId, queryClient]);

  useEffect(() => {
    if (!activeConversationId) return;
    const topic = `/topic/conversations/${activeConversationId}`;

    const handleThreadMessage = (message: IMessage) => {
      try {
        const newMessage = JSON.parse(message.body) as Message;
        queryClient.setQueryData<Message[] | undefined>(
          ['messages', activeConversationId],
          (prev) => (prev ? [...prev, newMessage] : [newMessage]),
        );
      } catch (err) {
        console.warn('[useInboxSocket] failed to parse thread message:', err);
      }
    };

    const unsubscribe = socketClient.subscribe(topic, handleThreadMessage);
    return () => unsubscribe();
  }, [activeConversationId, queryClient]);
}
