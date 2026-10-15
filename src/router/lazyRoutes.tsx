import { lazyWithRetry } from './lazyWithRetry';

// Lazy load all feature screens for code splitting
// Usa lazyWithRetry que verifica o cache de preload antes de fazer import
export const LoginScreen = lazyWithRetry('../features/auth/LoginScreen.tsx', () => import('../features/auth/LoginScreen.tsx'));
export const PdvScreen = lazyWithRetry('../features/pdv/PdvScreen.tsx', () => import('../features/pdv/PdvScreen.tsx'));
export const AcaiBuilderScreen = lazyWithRetry('../features/pdv/AcaiBuilderScreen.tsx', () => import('../features/pdv/AcaiBuilderScreen.tsx'));
export const QuickBuilderScreen = lazyWithRetry('../features/pdv/QuickBuilderScreen.tsx', () => import('../features/pdv/QuickBuilderScreen.tsx'));
export const NewTableScreen = lazyWithRetry('../features/pdv/NewTableScreen.tsx', () => import('../features/pdv/NewTableScreen.tsx'));
export const CheckoutScreen = lazyWithRetry('../features/pdv/CheckoutScreen.tsx', () => import('../features/pdv/CheckoutScreen.tsx'));
export const SettingsScreen = lazyWithRetry('../features/settings/SettingsScreen.tsx', () => import('../features/settings/SettingsScreen.tsx'));
export const ReportsScreen = lazyWithRetry('../features/reports/ReportsScreen.tsx', () => import('../features/reports/ReportsScreen.tsx'));
export const ChangePasswordScreen = lazyWithRetry('../features/auth/ChangePasswordScreen.tsx', () => import('../features/auth/ChangePasswordScreen.tsx'));
