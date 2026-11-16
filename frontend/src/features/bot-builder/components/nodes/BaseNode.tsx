import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Handle, Position } from '@xyflow/react';
import type { BotNodeConfig } from '../../types/botFlow';
import styles from './nodeStyles.module.css';

interface BaseNodeProps {
  icon: ReactNode;
  color: string;
  label: string;
  config: BotNodeConfig;
  selected?: boolean;
  showSource?: boolean;
  showTarget?: boolean;
  isStart?: boolean;
}

export function BaseNode({
  icon,
  color,
  label,
  config,
  selected,
  showSource = true,
  showTarget = true,
  isStart,
}: BaseNodeProps) {
  const bodyText = config.text ?? config.promptTemplate ?? config.url ?? config.reason ?? config.label;

  return (
    <div className={clsx(styles.node, selected && styles.selected)}>
      {showTarget && <Handle type="target" position={Position.Left} className={styles.handle} />}
      {isStart && <span className={styles.startBadge}>START</span>}
      <div className={styles.header} style={{ background: color }}>
        <span className={styles.iconWrap}>{icon}</span>
        <span>{config.label ?? label}</span>
      </div>
      {bodyText && (
        <div className={styles.body}>
          <div className={styles.bodyText}>{bodyText}</div>
        </div>
      )}
      {showSource && <Handle type="source" position={Position.Right} className={styles.handle} />}
    </div>
  );
}
