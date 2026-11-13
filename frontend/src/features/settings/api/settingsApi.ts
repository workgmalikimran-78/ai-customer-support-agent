import httpClient from '@/api/httpClient';
import type { WorkspaceSettings } from '../types/settings';

export async function fetchSettings(teamId: string): Promise<WorkspaceSettings> {
  const { data } = await httpClient.get<WorkspaceSettings>(`/api/teams/${teamId}/settings`);
  return data;
}

export async function updateSettings(
  teamId: string,
  settings: WorkspaceSettings,
): Promise<WorkspaceSettings> {
  const { data } = await httpClient.put<WorkspaceSettings>(`/api/teams/${teamId}/settings`, settings);
  return data;
}
