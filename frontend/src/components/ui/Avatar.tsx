import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  badge?: ReactNode;
  className?: string;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, src, size = 'md', badge, className }: AvatarProps) {
  return (
    <span className={clsx(styles.wrapper, styles[size], className)}>
      {src ? (
        <img src={src} alt={name} className={styles.img} />
      ) : (
        <span className={styles.initials}>{initialsFromName(name)}</span>
      )}
      {badge && <span className={styles.badgeSlot}>{badge}</span>}
    </span>
  );
}
