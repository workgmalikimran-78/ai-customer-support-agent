import { Card, CardHeader } from '@/components/ui/Card';
import { AlertTriangleIcon, InfoIcon, RocketIcon } from '@/components/icons/Icons';
import { relativeTimeFromNow } from '@/utils/time';
import type { AlertItem, AlertSeverity } from '../types/analytics';
import styles from './RecentAlertsPanel.module.css';

const SEVERITY_META: Record<AlertSeverity, { icon: typeof InfoIcon; className: string }> = {
  warning: { icon: AlertTriangleIcon, className: styles.warning },
  success: { icon: RocketIcon, className: styles.success },
  info: { icon: InfoIcon, className: styles.info },
};

export function RecentAlertsPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader title="Recent Alerts" subtitle="Live signal from your bots and queues" />
      <ul className={styles.list}>
        {alerts.map((alert) => {
          const meta = SEVERITY_META[alert.severity];
          const Icon = meta.icon;
          return (
            <li key={alert.id} className={styles.row}>
              <span className={`${styles.iconWrap} ${meta.className}`}>
                <Icon size={16} />
              </span>
              <span className={styles.message}>{alert.message}</span>
              <span className={styles.time}>{relativeTimeFromNow(alert.timestamp)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
