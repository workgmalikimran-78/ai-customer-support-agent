import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useInviteTeamMember } from '../hooks/useTeamMembers';
import type { TeamRole } from '../types/team';

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Agent', label: 'Agent' },
  { value: 'Viewer', label: 'Viewer' },
];

export function InviteMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('Agent');
  const inviteMutation = useInviteTeamMember();

  function handleSubmit() {
    if (!email.trim()) return;
    inviteMutation.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail('');
          setRole('Agent');
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite teammate"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Email address"
          type="email"
          placeholder="teammate@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as TeamRole)}
          options={ROLE_OPTIONS}
        />
      </div>
    </Modal>
  );
}
