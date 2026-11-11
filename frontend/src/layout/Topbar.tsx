import { BellIcon, ChevronDownIcon, SearchIcon } from '@/components/icons/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import styles from './Topbar.module.css';

export function Topbar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className={styles.topbar}>
      <div className={styles.searchWrap}>
        <Input placeholder="Search conversations, flows, teammates…" leftIcon={<SearchIcon size={16} />} />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <BellIcon size={18} />
          <span className={styles.badgeDot} />
        </button>

        <button type="button" className={styles.userButton}>
          <Avatar name={user.name} size="sm" />
          <span className={styles.userName}>{user.name}</span>
          <ChevronDownIcon size={14} />
        </button>
      </div>
    </header>
  );
}
