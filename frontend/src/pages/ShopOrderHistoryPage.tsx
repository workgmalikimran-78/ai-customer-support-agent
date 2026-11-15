import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useCustomerOrders } from '@/features/shop/hooks/useCustomerOrders';
import styles from './ShopOrderHistoryPage.module.css';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ShopOrderHistoryPage() {
  const { data: orders, isLoading } = useCustomerOrders();

  if (isLoading) {
    return <div className={styles.loading}>Loading orders…</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>My Orders</h1>

      {orders?.length === 0 && <div className={styles.empty}>You haven't placed any orders yet.</div>}

      <div className={styles.list}>
        {orders?.map((order) => (
          <Card key={order.id} className={styles.card}>
            <div className={styles.header}>
              <span className={styles.orderId}>Order #{order.id.slice(0, 8)}</span>
              <Badge tone={order.status === 'FULFILLED' ? 'green' : order.status === 'CANCELLED' ? 'red' : 'purple'}>
                {order.status}
              </Badge>
            </div>
            <ul className={styles.items}>
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}x {item.productName} — {formatPrice(item.unitPriceCents * item.quantity)}
                </li>
              ))}
            </ul>
            <div className={styles.footer}>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              <span className={styles.total}>{formatPrice(order.totalCents)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
