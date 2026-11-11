import { Card } from '../ui/Card';
import styles from './MetricCards.module.css';

interface GaugeCardProps {
  title: string;
  percent: number;
  caption?: string;
}

/**
 * Lightweight dependency-free circular gauge built with a plain SVG circle
 * and `stroke-dasharray`, rather than pulling in react-circular-progressbar.
 */
export function GaugeCard({ title, percent, caption }: GaugeCardProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{title}</span>
      </div>
      <div className={styles.gaugeWrap}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <text
            x="60"
            y="64"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="var(--color-text)"
          >
            {Math.round(clamped)}%
          </text>
        </svg>
      </div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </Card>
  );
}
