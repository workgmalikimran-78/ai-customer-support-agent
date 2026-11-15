import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerLogin } from '@/features/shop/api/customerAuthApi';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import styles from './ShopLoginPage.module.css';

export default function ShopLoginPage() {
  const navigate = useNavigate();
  const setCustomer = useCustomerAuthStore((s) => s.setCustomer);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await customerLogin({ email, password });
      localStorage.setItem('smartify_customer_token', response.token);
      setCustomer({ id: response.customerId, name: response.displayName, email: response.email });
      navigate('/shop', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'];
        setError(`Too many failed attempts. Try again in ${retryAfter ?? 'a few'} seconds.`);
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Could not reach the server. Is the backend running?');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card} padding="lg">
        <h1 className={styles.title}>Smartify Shop</h1>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className={styles.footerLink}>
          New here? <Link to="/shop/register">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
