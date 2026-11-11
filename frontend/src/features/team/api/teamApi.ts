import httpClient from '@/api/httpClient';
import type { TeamMember, TeamRole } from '../types/team';
import { MOCK_TEAM_MEMBERS } from './mockTeam';

let mockMembersCache: TeamMember[] = structuredClone(MOCK_TEAM_MEMBERS);

export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const { data } = await httpClient.get<TeamMember[]>(`/api/teams/${teamId}/members`);
    return data;
  } catch (err) {
    console.warn('[teamApi] fetchTeamMembers falling back to mock data:', err);
    return structuredClone(mockMembersCache);
  }
}

export async function inviteTeamMember(
  teamId: string,
  input: { email: string; role: TeamRole },
): Promise<TeamMember> {
  try {
    const { data } = await httpClient.post<TeamMember>(`/api/teams/${teamId}/members/invite`, input);
    return data;
  } catch (err) {
    console.warn('[teamApi] inviteTeamMember falling back to mock cache:', err);
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: input.email.split('@')[0],
      email: input.email,
      role: input.role,
      status: 'invited',
    };
    mockMembersCache = [...mockMembersCache, newMember];
    return newMember;
  }
}
