import type { ReactElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { ShopLayout } from '@/features/shop/components/ShopLayout';
import { useAuthStore } from '@/store/authStore';
import { useCustomerAuthStore } from '@/store/customerAuthStore';
import DashboardPage from '@/pages/DashboardPage';
import UnifiedInboxPage from '@/pages/UnifiedInboxPage';
import ChatbotBuilderPage from '@/pages/ChatbotBuilderPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import TeamPage from '@/pages/TeamPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import WebChatWidgetPage from '@/pages/WebChatWidgetPage';
import ShopCatalogPage from '@/pages/ShopCatalogPage';
import ShopProductPage from '@/pages/ShopProductPage';
import ShopOrderHistoryPage from '@/pages/ShopOrderHistoryPage';
import ShopLoginPage from '@/pages/ShopLoginPage';
import ShopRegisterPage from '@/pages/ShopRegisterPage';

function RequireAuth({ children }: { children: ReactElement }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequireCustomerAuth({ children }: { children: ReactElement }) {
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/shop/login" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/widget', element: <WebChatWidgetPage /> },
  { path: '/shop/login', element: <ShopLoginPage /> },
  { path: '/shop/register', element: <ShopRegisterPage /> },
  {
    path: '/shop',
    element: <ShopLayout />,
    children: [
      { index: true, element: <ShopCatalogPage /> },
      { path: 'product/:id', element: <ShopProductPage /> },
      {
        path: 'orders',
        element: (
          <RequireCustomerAuth>
            <ShopOrderHistoryPage />
          </RequireCustomerAuth>
        ),
      },
    ],
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/inbox" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'inbox', element: <UnifiedInboxPage /> },
      { path: 'chatbot-builder', element: <ChatbotBuilderPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'team', element: <TeamPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/inbox" replace /> },
    ],
  },
]);
