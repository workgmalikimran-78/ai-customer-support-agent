export interface ChannelToggleState {
  webchat: boolean;
  whatsapp: boolean;
  facebook: boolean;
  browser: boolean;
}

export interface WorkspaceSettings {
  workspaceName: string;
  supportEmail: string;
  timezone: string;
  channels: ChannelToggleState;
  apiKey: string;
}
