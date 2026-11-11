import { BrowserIcon, FacebookIcon, WebChatIcon, WhatsAppIcon } from '@/components/icons/Icons';
import type { Channel } from '../types/inbox';
import styles from './ChannelBadgeIcon.module.css';

const CHANNEL_META: Record<Channel, { label: string; Icon: typeof WebChatIcon; colorVar: string }> = {
  webchat: { label: 'Web Chat', Icon: WebChatIcon, colorVar: 'var(--color-webchat)' },
  whatsapp: { label: 'WhatsApp', Icon: WhatsAppIcon, colorVar: 'var(--color-whatsapp)' },
  facebook: { label: 'Facebook', Icon: FacebookIcon, colorVar: 'var(--color-facebook)' },
  browser: { label: 'Browser', Icon: BrowserIcon, colorVar: 'var(--color-browser)' },
};

export function getChannelLabel(channel: Channel) {
  return CHANNEL_META[channel].label;
}

export function ChannelBadgeIcon({ channel, size = 16 }: { channel: Channel; size?: number }) {
  const { Icon, colorVar } = CHANNEL_META[channel];
  return (
    <span className={styles.badge} style={{ background: colorVar }}>
      <Icon size={size * 0.62} color="#fff" />
    </span>
  );
}
