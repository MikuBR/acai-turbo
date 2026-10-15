import { Navigate } from 'react-router'
import { requireAuth } from './authGuard.js'
import AppLayout from '../layouts/AppLayout.tsx'
import LazyRoute from './LazyRoute'
import {
  LoginScreen,
  PdvScreen,
  AcaiBuilderScreen,
  QuickBuilderScreen,
  NewTableScreen,
  CheckoutScreen,
  SettingsScreen,
  ReportsScreen,
  ChangePasswordScreen,
} from './lazyRoutes'

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
      { path: 'pdv', element: <LazyRoute><PdvScreen /></LazyRoute> },
      { path: 'pdv/builder/acai', element: <LazyRoute><AcaiBuilderScreen /></LazyRoute> },
      { path: 'pdv/builder/quick', element: <LazyRoute><QuickBuilderScreen /></LazyRoute> },
      { path: 'pdv/new-table', element: <LazyRoute><NewTableScreen /></LazyRoute> },
      { path: 'checkout', element: <LazyRoute><CheckoutScreen /></LazyRoute> },
      { path: 'settings', element: <LazyRoute><SettingsScreen /></LazyRoute> },
      { path: 'reports', element: <LazyRoute><ReportsScreen /></LazyRoute> },
      { path: 'change-password', element: <LazyRoute><ChangePasswordScreen /></LazyRoute> },
    ],
  },
]

export default routes
