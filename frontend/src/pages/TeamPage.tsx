import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { InviteMemberModal } from '@/features/team/components/InviteMemberModal';
import { useTeamMembers } from '@/features/team/hooks/useTeamMembers';
import type { TeamMemberStatus, TeamRole } from '@/features/team/types/team';
import styles from './TeamPage.module.css';

const ROLE_TONE: Record<TeamRole, 'purple' | 'blue' | 'green' | 'neutral'> = {
  Admin: 'purple',
  Manager: 'blue',
  Agent: 'green',
  Viewer: 'neutral',
};

const STATUS_TONE: Record<TeamMemberStatus, 'green' | 'yellow' | 'red'> = {
  active: 'green',
  invited: 'yellow',
  suspended: 'red',
};

export default function TeamPage() {
  const { data: members, isLoading } = useTeamMembers();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage who has access to your Smartify workspace."
        action={<Button variant="primary" onClick={() => setInviteOpen(true)}>Invite</Button>}
      />

      <Card padding="none">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  Loading team members…
                </td>
              </tr>
            )}
            {members?.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className={styles.memberCell}>
                    <Avatar name={member.name} size="sm" src={member.avatarUrl} />
                    <span>{member.name}</span>
                  </div>
                </td>
                <td className={styles.emailCell}>{member.email}</td>
                <td>
                  <Badge tone={ROLE_TONE[member.role]}>{member.role}</Badge>
                </td>
                <td>
                  <Badge tone={STATUS_TONE[member.status]} dot>
                    {member.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
