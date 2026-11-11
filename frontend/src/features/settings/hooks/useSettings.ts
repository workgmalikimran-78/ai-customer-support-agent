import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { fetchSettings, updateSettings } from '../api/settingsApi';
import type { WorkspaceSettings } from '../types/settings';

export function useSettings() {
  const teamId = useAuthStore((s) => s.user.teamId);

  return useQuery({
    queryKey: ['settings', teamId],
    queryFn: () => fetchSettings(teamId),
    staleTime: 30_000,
  });
}

export function useUpdateSettings() {
  const teamId = useAuthStore((s) => s.user.teamId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: WorkspaceSettings) => updateSettings(teamId, settings),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', teamId], data);
    },
  });
}
