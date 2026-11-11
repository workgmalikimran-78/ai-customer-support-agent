import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card } from '../ui/Card';
import styles from './MetricCards.module.css';

interface ResponseTimeBarCardProps {
  title: string;
  data: { day: string; seconds: number }[];
  caption?: string;
}

export function ResponseTimeBarCard({ title, data, caption }: ResponseTimeBarCardProps) {
  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{title}</span>
      </div>
      <div className={styles.barChartWrap}>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-text-faint)', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(139,92,246,0.08)' }}
              contentStyle={{
                background: '#1a1430',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}s`, 'Avg response']}
            />
            <Bar dataKey="seconds" radius={[6, 6, 6, 6]} fill="var(--color-accent)" maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </Card>
  );
}
