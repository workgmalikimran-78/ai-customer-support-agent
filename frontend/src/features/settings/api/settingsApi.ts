import httpClient from '@/api/httpClient';
import type { WorkspaceSettings } from '../types/settings';
import { MOCK_SETTINGS } from './mockSettings';

let mockSettingsCache: WorkspaceSettings = structuredClone(MOCK_SETTINGS);

export async function fetchSettings(teamId: string): Promise<WorkspaceSettings> {
  try {
    const { data } = await httpClient.get<WorkspaceSettings>(`/api/teams/${teamId}/settings`);
    return data;
  } catch (err) {
    console.warn('[settingsApi] fetchSettings falling back to mock data:', err);
    return structuredClone(mockSettingsCache);
  }
}

export async function updateSettings(
  teamId: string,
  settings: WorkspaceSettings,
): Promise<WorkspaceSettings> {
  try {
    const { data } = await httpClient.put<WorkspaceSettings>(`/api/teams/${teamId}/settings`, settings);
    return data;
  } catch (err) {
    console.warn('[settingsApi] updateSettings falling back to mock cache:', err);
    mockSettingsCache = structuredClone(settings);
    return structuredClone(mockSettingsCache);
  }
}
