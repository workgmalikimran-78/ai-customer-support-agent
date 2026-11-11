import { Card } from '../ui/Card';
import styles from './MetricCards.module.css';

interface SentimentBarCardProps {
  title: string;
  score: number; // -100 .. 100
  caption?: string;
}

function emojiForScore(score: number) {
  if (score >= 60) return '😄';
  if (score >= 20) return '🙂';
  if (score >= -20) return '😐';
  if (score >= -60) return '🙁';
  return '😡';
}

export function SentimentBarCard({ title, score, caption }: SentimentBarCardProps) {
  const clamped = Math.max(-100, Math.min(100, score));
  const percent = ((clamped + 100) / 200) * 100;

  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{title}</span>
      </div>
      <div className={styles.sentimentRow}>
        <span className={styles.sentimentEmoji}>{emojiForScore(clamped)}</span>
        <span className={styles.metricValue}>{clamped}</span>
      </div>
      <div className={styles.sentimentTrack}>
        <div className={styles.sentimentMarker} style={{ left: `${percent}%` }} />
      </div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </Card>
  );
}
