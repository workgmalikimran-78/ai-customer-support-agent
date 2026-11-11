import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettings, useUpdateSettings } from '@/features/settings/hooks/useSettings';
import type { ChannelToggleState, WorkspaceSettings } from '@/features/settings/types/settings';
import styles from './SettingsPage.module.css';

const CHANNEL_LABELS: Record<keyof ChannelToggleState, string> = {
  webchat: 'Web Chat Widget',
  whatsapp: 'WhatsApp Business',
  facebook: 'Facebook Messenger',
  browser: 'In-Browser Support',
};

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const [form, setForm] = useState<WorkspaceSettings | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings, form]);

  if (isLoading || !form) {
    return <div className={styles.loading}>Loading settings…</div>;
  }

  function handleSave() {
    if (form) updateMutation.mutate(form);
  }

  function toggleChannel(key: keyof ChannelToggleState) {
    setForm((prev) =>
      prev ? { ...prev, channels: { ...prev.channels, [key]: !prev.channels[key] } } : prev,
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure your workspace, channels, and API access."
        action={
          <Button variant="primary" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        }
      />

      <div className={styles.sectionsGrid}>
        <Card>
          <CardHeader title="General Information" subtitle="Basic details about your workspace" />
          <div className={styles.formStack}>
            <Input
              label="Workspace name"
              value={form.workspaceName}
              onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
            />
            <Input
              label="Support email"
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            />
            <Input
              label="Timezone"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Channels" subtitle="Enable or disable support channels" />
          <div className={styles.channelList}>
            {(Object.keys(CHANNEL_LABELS) as (keyof ChannelToggleState)[]).map((key) => (
              <div key={key} className={styles.channelRow}>
                <span>{CHANNEL_LABELS[key]}</span>
                <button
                  type="button"
                  className={`${styles.toggle} ${form.channels[key] ? styles.toggleOn : ''}`}
                  onClick={() => toggleChannel(key)}
                  aria-pressed={form.channels[key]}
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.apiKeyCard}>
          <CardHeader title="API Access" subtitle="Use this key to authenticate backend requests" />
          <div className={styles.apiKeyRow}>
            <Input
              readOnly
              value={showApiKey ? form.apiKey : '•'.repeat(24)}
              className={styles.apiKeyInput}
            />
            <Button variant="secondary" size="sm" onClick={() => setShowApiKey((s) => !s)}>
              {showApiKey ? 'Hide' : 'Reveal'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
