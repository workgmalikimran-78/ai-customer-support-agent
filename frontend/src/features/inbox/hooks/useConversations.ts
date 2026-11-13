import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { fetchConversations } from '../api/inboxApi';

export function useConversations() {
  const teamId = useAuthStore((s) => s.user.teamId);

  return useQuery({
    queryKey: ['conversations', teamId],
    queryFn: () => fetchConversations(),
    staleTime: 15_000,
  });
}
