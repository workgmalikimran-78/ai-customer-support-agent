import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMessages, sendMessage } from '../api/inboxApi';
import type { Message } from '../types/inbox';

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId as string),
    enabled: Boolean(conversationId),
    staleTime: 10_000,
  });
}

export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => sendMessage(conversationId as string, text),
    onSuccess: (newMessage) => {
      if (!conversationId) return;
      queryClient.setQueryData<Message[] | undefined>(['messages', conversationId], (prev) =>
        prev ? [...prev, newMessage] : [newMessage],
      );
    },
  });
}
