import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 18) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function DashboardIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function InboxIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 12h4l2 3h6l2-3h4" />
      <path d="M5.5 5h13l2.5 7v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7l2.5-7Z" />
    </svg>
  );
}

export function BotIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="4" y="8" width="16" height="11" rx="2.5" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1.3" fill="currentColor" />
      <circle cx="9" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="15" cy="13.5" r="1.2" fill="currentColor" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function AnalyticsIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M20 19H4" />
    </svg>
  );
}

export function TeamIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.7 19c.8-3 3.2-5 6.3-5s5.5 2 6.3 5" />
      <circle cx="17" cy="8" r="2.4" />
      <path d="M15.8 11.2c2.3.4 4 2.2 4.6 4.6" />
    </svg>
  );
}

export function SettingsIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.6-2-3.4-2.4.6a8 8 0 0 0-1.7-1l-.4-2.5h-4L10.5 5a8 8 0 0 0-1.7 1l-2.4-.6-2 3.4L6.4 11a7.9 7.9 0 0 0 0 2l-2 1.6 2 3.4 2.4-.6c.5.4 1.1.75 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4.6 2-3.4-2-1.6Z" />
    </svg>
  );
}

export function SearchIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function BellIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5C5 14 6 12.5 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChevronDownIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function FilterIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </svg>
  );
}

export function PaperclipIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M21 11.5 12.4 20a4.5 4.5 0 0 1-6.4-6.4L14 5.6a3 3 0 0 1 4.3 4.3L10 18.2" />
    </svg>
  );
}

export function SendIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

export function PlusIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrendUpIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function AlertTriangleIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </svg>
  );
}

export function RocketIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 2c3 1 5 5 4.5 9.5L19 14l-3 .5c-.6 2-2 3.8-4 5.5-2-1.7-3.4-3.5-4-5.5L5 14l2.5-2.5C7 5 9 3 12 2Z" />
      <circle cx="12" cy="9" r="1.4" fill="currentColor" />
      <path d="M8.5 17.5 7 21l3.3-1.2" />
      <path d="M15.5 17.5 17 21l-3.3-1.2" />
    </svg>
  );
}

export function InfoIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v6" />
      <circle cx="12" cy="7.5" r="0.4" fill="currentColor" />
    </svg>
  );
}

export function WebChatIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="4" width="18" height="13" rx="2.5" />
      <path d="M8 21l3-4h2l3 4" />
    </svg>
  );
}

export function WhatsAppIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 20l1.4-4A8 8 0 1 1 9 18.5L4 20Z" />
      <path d="M9 10c0 3 2.5 5 5 5" />
    </svg>
  );
}

export function FacebookIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M14 8.5h-1.5A1.5 1.5 0 0 0 11 10v2H9v2.5h2V21h2.5v-6.5H15L15.5 12h-2V10c0-.3.2-.5.5-.5H15Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BrowserIcon({ size, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function LogoMark({ size = 32, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" {...rest}>
      <defs>
        <linearGradient id="smartify-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#smartify-logo-grad)" />
      <path
        d="M10 20.5c0-3.6 2.9-6.5 6.5-6.5S23 16.9 23 20.5"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="11.5" r="2" fill="white" />
    </svg>
  );
}
