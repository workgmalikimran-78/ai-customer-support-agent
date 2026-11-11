export type TeamRole = 'Admin' | 'Manager' | 'Agent' | 'Viewer';
export type TeamMemberStatus = 'active' | 'invited' | 'suspended';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  avatarUrl?: string;
}
