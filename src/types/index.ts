// ============================================================
// Tipos TypeScript do Açaí Wave
// ============================================================

// --- Produtos e Catálogo ---
export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  ingredients?: string;
}

export interface Category {
  id: number;
  name: string;
}

// --- Mesas e Comandas ---
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  ingredients?: string;
  notes?: string;
}

export interface Table {
  id: number;
  name: string;
  isDelivery: boolean;
  address: string;
  phone: string;
  items: MenuItem[];
  total: number;
  ifoodOrderId?: string | null;
}

// --- Pagamentos ---
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'DÉBITO' | 'CRÉDITO' | 'PERMUTA';

export interface Payment {
  method: PaymentMethod;
  amount: number;
  exchangeFor?: string;
}

// --- Pedidos ---
export interface Order {
  id: number;
  customer_name: string;
  total: number;
  original_total: number;
  discount: number;
  promotion_id: number | null;
  promotion_name: string | null;
  payment_method: string;
  is_delivery: boolean;
  address: string;
  phone: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_name: string;
  price: number;
  notes: string;
  category: string;
}

// --- Usuários e Autenticação ---
export type UserRole = 'admin' | 'manager' | 'operator';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  must_change_password: number;
}

// --- IPC ---
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Promoções ---
export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';
export type PromotionScope = 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCT';

export interface Promotion {
  id: number;
  name: string;
  type: PromotionType;
  value: number;
  applies_to: PromotionScope;
  target_category: string;
  target_product_id: number | null;
  min_quantity: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

// --- Financeiro ---
export interface FinancialAccount {
  id: number;
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  due_date: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  category: string | null;
  created_at: string;
}

// --- Clientes ---
export interface Client {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  notes: string;
  created_at: string;
}

// --- iFood ---
export interface IfoodConfig {
  clientId: string;
  clientSecret: string;
  merchantId: string;
  enabled: boolean;
}

// --- Componentes ---
export interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  children?: React.ReactNode;
  childrenSlot?: 'append' | 'prepend' | 'above' | 'below';
}

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface CartPanelProps {
  activeTable: Table;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  onDeleteTable: (id: number) => void;
  ifoodOrderId?: string | null;
  onIfoodAction?: (action: string, orderId: string) => void;
}

export interface OrderSidebarProps {
  tables: Table[];
  activeTableId: number;
  onSelectTable: (id: number) => void;
  onNewTable: () => void;
  onOpenReports: () => void;
  onOpenSettings: () => void;
  onOpenCash: () => void;
  onLogout: () => void;
  onDeleteTable: (id: number) => void;
  ifoodConnected: boolean;
  ifoodUnreadCount: number;
}
