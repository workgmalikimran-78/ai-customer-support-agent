import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { Card } from '../ui/Card';
import { TrendUpIcon } from '../icons/Icons';
import styles from './MetricCards.module.css';

interface SparklineCardProps {
  title: string;
  value: string | number;
  trendLabel?: string;
  caption?: string;
  data: { x: string | number; y: number }[];
}

export function SparklineCard({ title, value, trendLabel, caption, data }: SparklineCardProps) {
  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{title}</span>
        {trendLabel && (
          <span className={styles.trendPill}>
            <TrendUpIcon size={12} />
            {trendLabel}
          </span>
        )}
      </div>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.sparklineWrap}>
        <ResponsiveContainer width="100%" height={56}>
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{
                background: '#1a1430',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={() => ''}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="var(--color-accent-light)"
              strokeWidth={2}
              fill="url(#sparklineFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </Card>
  );
}
