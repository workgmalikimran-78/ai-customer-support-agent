import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProduct } from '@/features/shop/hooks/useProducts';
import { usePlaceOrder } from '@/features/shop/hooks/useCustomerOrders';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import styles from './ShopProductPage.module.css';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ShopProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const placeOrderMutation = usePlaceOrder();
  const [quantity, setQuantity] = useState(1);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  if (isLoading || !product) {
    return <div className={styles.loading}>Loading product…</div>;
  }

  function handlePlaceOrder() {
    if (!product) return;
    setConfirmation(null);
    placeOrderMutation.mutate(
      { productId: product.id, quantity },
      {
        onSuccess: () => setConfirmation('Order placed! View it in My Orders.'),
      },
    );
  }

  const outOfStock = product.stockQuantity === 0;

  return (
    <div>
      <Link to="/shop" className={styles.backLink}>
        ← Back to shop
      </Link>

      <Card className={styles.card}>
        <h1 className={styles.name}>{product.name}</h1>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.price}>{formatPrice(product.priceCents)}</div>
        <div className={styles.stock}>
          {outOfStock ? 'Out of stock' : `${product.stockQuantity} in stock`}
        </div>

        {!isAuthenticated ? (
          <p className={styles.loginPrompt}>
            <Link to="/shop/login">Log in</Link> to place an order.
          </p>
        ) : (
          <div className={styles.orderForm}>
            <Input
              type="number"
              label="Quantity"
              min={1}
              max={product.stockQuantity}
              value={quantity}
              disabled={outOfStock}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
            <Button
              variant="primary"
              disabled={outOfStock || placeOrderMutation.isPending}
              onClick={handlePlaceOrder}
            >
              {placeOrderMutation.isPending ? 'Placing order…' : 'Place order'}
            </Button>
          </div>
        )}

        {confirmation && <p className={styles.confirmation}>{confirmation}</p>}
        {placeOrderMutation.isError && (
          <p className={styles.error}>
            {(placeOrderMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Could not place order. Please try again.'}
          </p>
        )}
      </Card>
    </div>
  );
}
