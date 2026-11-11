import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import DashboardPage from '@/pages/DashboardPage';
import UnifiedInboxPage from '@/pages/UnifiedInboxPage';
import ChatbotBuilderPage from '@/pages/ChatbotBuilderPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import TeamPage from '@/pages/TeamPage';
import SettingsPage from '@/pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
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
