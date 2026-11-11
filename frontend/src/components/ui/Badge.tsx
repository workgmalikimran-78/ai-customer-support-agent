import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Badge.module.css';

export type BadgeTone = 'purple' | 'green' | 'red' | 'yellow' | 'blue' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  children?: ReactNode;
}

export function Badge({ tone = 'neutral', dot, className, children, ...rest }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[tone], className)} {...rest}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
