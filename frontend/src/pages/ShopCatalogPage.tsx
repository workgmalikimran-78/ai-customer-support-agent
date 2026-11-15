import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useProducts } from '@/features/shop/hooks/useProducts';
import styles from './ShopCatalogPage.module.css';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ShopCatalogPage() {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return <div className={styles.loading}>Loading products…</div>;
  }

  return (
    <div>
      <h1 className={styles.title}>Shop</h1>
      <p className={styles.subtitle}>Browse our catalog and place an order.</p>

      <div className={styles.grid}>
        {products?.map((product) => (
          <Link key={product.id} to={`/shop/product/${product.id}`} className={styles.cardLink}>
            <Card className={styles.card}>
              <div className={styles.name}>{product.name}</div>
              <div className={styles.description}>{product.description}</div>
              <div className={styles.footer}>
                <span className={styles.price}>{formatPrice(product.priceCents)}</span>
                {product.stockQuantity === 0 ? (
                  <Badge tone="red">Out of stock</Badge>
                ) : (
                  <Badge tone="green">{product.stockQuantity} in stock</Badge>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
