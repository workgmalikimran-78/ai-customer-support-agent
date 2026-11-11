import type { TeamMember } from '../types/team';

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Enterprise Admin',
    email: 'qbric_developer1@nisum.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: 'member-2',
    name: 'Jordan Blake',
    email: 'jordan.blake@smartify.ai',
    role: 'Manager',
    status: 'active',
  },
  {
    id: 'member-3',
    name: 'Riya Shah',
    email: 'riya.shah@smartify.ai',
    role: 'Agent',
    status: 'active',
  },
  {
    id: 'member-4',
    name: 'Chen Wei',
    email: 'chen.wei@smartify.ai',
    role: 'Agent',
    status: 'invited',
  },
  {
    id: 'member-5',
    name: 'Lucas Ferreira',
    email: 'lucas.ferreira@smartify.ai',
    role: 'Viewer',
    status: 'suspended',
  },
];
