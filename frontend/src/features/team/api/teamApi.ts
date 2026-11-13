import httpClient from '@/api/httpClient';
import type { TeamMember, TeamRole } from '../types/team';

interface UserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  // Jackson serializes Lombok's `isActive` boolean field/getter as "active", not "isActive".
  active: boolean;
}

const ROLE_FROM_BACKEND: Record<string, TeamRole> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
};

const ROLE_TO_BACKEND: Record<TeamRole, string> = {
  Admin: 'ADMIN',
  Manager: 'MANAGER',
  Agent: 'AGENT',
  Viewer: 'AGENT', // backend's UserRole enum has no Viewer role yet
};

function toTeamMember(dto: UserDto): TeamMember {
  return {
    id: dto.id,
    name: dto.displayName,
    email: dto.email,
    role: ROLE_FROM_BACKEND[dto.role] ?? 'Agent',
    status: dto.active ? 'active' : 'suspended', // backend only tracks active/inactive, no separate "invited" state yet
    avatarUrl: dto.avatarUrl ?? undefined,
  };
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data } = await httpClient.get<UserDto[]>('/api/team');
  return data.map(toTeamMember);
}

export async function inviteTeamMember(input: { email: string; role: TeamRole }): Promise<TeamMember> {
  const { data } = await httpClient.post<UserDto>('/api/team/invite', {
    email: input.email,
    displayName: input.email.split('@')[0],
    role: ROLE_TO_BACKEND[input.role],
  });
  return toTeamMember(data);
}
