import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { LogoMark } from '@/components/icons/Icons';
import {
  AnalyticsIcon,
  BotIcon,
  DashboardIcon,
  InboxIcon,
  SettingsIcon,
  TeamIcon,
} from '@/components/icons/Icons';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/inbox', label: 'Unified Inbox', icon: InboxIcon },
  { to: '/chatbot-builder', label: 'Chatbot Builder', icon: BotIcon },
  { to: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { to: '/team', label: 'Team', icon: TeamIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <LogoMark size={32} />
        <span className={styles.logoText}>Smartify</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.navItemActive)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.upsellCard}>
          <p className={styles.upsellTitle}>Upgrade to Pro</p>
          <p className={styles.upsellCopy}>Unlock advanced AI flows &amp; analytics.</p>
        </div>
      </div>
    </aside>
  );
}
