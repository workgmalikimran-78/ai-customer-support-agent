import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import styles from './MetricCards.module.css';

interface MiniSentimentCardProps {
  title: string;
  emoji: string;
  description: string;
  data: { x: string | number; y: number }[];
}

export function MiniSentimentCard({ title, emoji, description, data }: MiniSentimentCardProps) {
  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{title}</span>
      </div>
      <div className={styles.miniSentimentRow}>
        <span className={styles.miniSentimentEmoji}>{emoji}</span>
        <span className={styles.miniSentimentText}>{description}</span>
      </div>
      <div className={styles.miniSparklineWrap}>
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="miniSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke="var(--color-success)"
              strokeWidth={2}
              fill="url(#miniSparkFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
