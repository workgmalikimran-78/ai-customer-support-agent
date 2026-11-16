import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ChatWidgetLauncher } from '@/features/webchat/components/ChatWidgetLauncher';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import styles from './ShopLayout.module.css';

export function ShopLayout() {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const customer = useCustomerAuthStore((s) => s.customer);
  const logout = useCustomerAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/shop', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/shop" className={styles.brand}>
          Smartify Shop
        </Link>
        <nav className={styles.nav}>
          {isAuthenticated ? (
            <>
              <Link to="/shop/orders">My Orders</Link>
              <span className={styles.customerName}>{customer.name}</span>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/shop/login">Log in</Link>
              <Link to="/shop/register">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
      {/* Available to anonymous shoppers too, not just logged-in customers -- that's the
          whole point of letting visitors chat with support before creating an account. */}
      <ChatWidgetLauncher />
    </div>
  );
}
