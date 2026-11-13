import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { fetchTeamMembers, inviteTeamMember } from '../api/teamApi';
import type { TeamMember, TeamRole } from '../types/team';

export function useTeamMembers() {
  const teamId = useAuthStore((s) => s.user.teamId);

  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => fetchTeamMembers(),
    staleTime: 30_000,
  });
}

export function useInviteTeamMember() {
  const teamId = useAuthStore((s) => s.user.teamId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; role: TeamRole }) => inviteTeamMember(input),
    onSuccess: (newMember) => {
      queryClient.setQueryData<TeamMember[] | undefined>(['team-members', teamId], (prev) =>
        prev ? [...prev, newMember] : [newMember],
      );
    },
  });
}
