import { Navigate } from 'react-router';
import { requireAuth } from './authGuard.js';
import AppLayout from '../layouts/AppLayout.jsx';
import SettingsScreen from '../features/settings/SettingsScreen.jsx';
import ReportsScreen from '../features/reports/ReportsScreen.jsx';
import CheckoutScreen from '../features/pdv/CheckoutScreen.jsx';
import LoginScreen from '../features/auth/LoginScreen.jsx';
import ChangePasswordScreen from '../features/auth/ChangePasswordScreen.jsx';
import PdvScreen from '../features/pdv/PdvScreen.jsx';
import AcaiBuilderScreen from '../features/pdv/AcaiBuilderScreen.jsx';
import QuickBuilderScreen from '../features/pdv/QuickBuilderScreen.jsx';
import NewTableScreen from '../features/pdv/NewTableScreen.jsx';

const routes = [
  {
    path: '/login',
    Component: LoginScreen,
  },
  {
    path: '/',
    loader: requireAuth,
    Component: AppLayout,
    children: [
      { index: true, element: <Navigate to="/pdv" replace /> },
      { path: 'pdv', element: <PdvScreen /> },
      { path: 'pdv/builder/acai', element: <AcaiBuilderScreen /> },
      { path: 'pdv/builder/quick', element: <QuickBuilderScreen /> },
      { path: 'pdv/new-table', element: <NewTableScreen /> },
      { path: 'checkout', element: <CheckoutScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'reports', element: <ReportsScreen /> },
      { path: 'change-password', element: <ChangePasswordScreen /> },
    ],
  },
];

export default routes;
