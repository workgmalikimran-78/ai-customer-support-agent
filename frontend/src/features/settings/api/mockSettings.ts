import type { WorkspaceSettings } from '../types/settings';

export const MOCK_SETTINGS: WorkspaceSettings = {
  workspaceName: 'Smartify Enterprise',
  supportEmail: 'support@smartify.ai',
  timezone: 'America/New_York',
  channels: {
    webchat: true,
    whatsapp: true,
    facebook: false,
    browser: true,
  },
  apiKey: 'sk_live_smartify_7f3c9a2b4e5d6f10',
};
