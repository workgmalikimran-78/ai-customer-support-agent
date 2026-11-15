import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customerRegister } from '@/features/shop/api/customerAuthApi';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import styles from './ShopLoginPage.module.css';

export default function ShopRegisterPage() {
  const navigate = useNavigate();
  const setCustomer = useCustomerAuthStore((s) => s.setCustomer);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await customerRegister({ displayName, email, password });
      localStorage.setItem('smartify_customer_token', response.token);
      setCustomer({ id: response.customerId, name: response.displayName, email: response.email });
      navigate('/shop', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError('An account with that email already exists.');
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
        <p className={styles.subtitle}>Create your account</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Full name"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className={styles.footerLink}>
          Already have an account? <Link to="/shop/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
