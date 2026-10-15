import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import useToastStore from '../../store/toastStore'
import useLoadingStore from '../../store/loadingStore'
import { getIPC } from '../../services/ipc.js'
import logger from '../../services/logger.js'
import ReportsModal from '../../components/organisms/ReportsModal.tsx'
import { usePerformanceMark } from '../../hooks/usePerformanceMark'
import type { User } from '../../types'

interface Sale {
  payment_method: string
  order_count: number
  total_amount: number
}

interface Movement {
  type: 'ENTRADA' | 'SAIDA'
  description: string
  total_amount: number
  created_at?: string
}

interface TopProduct {
  product_name: string
  qty: number
  total_revenue: number
  avg_price: number
}

interface ReportData {
  sales: Sale[]
  movements: Movement[]
  topProducts: TopProduct[]
}

interface Order {
  id: number
  customer_name: string
  total: number
  is_delivery: boolean
  payment_method: string
  created_at: string
  items?: Array<{ id: number; product_name: string; price: number; notes?: string }>
}

interface CashMove {
  type: 'ENTRADA' | 'SAIDA'
  amount: string
  description: string
}

interface ReportPeriod {
  startDate: string
  endDate: string
}

interface FinancialSummary {
  payable: { pending: number; paid: number; total: number }
  receivable: { pending: number; paid: number; total: number }
}

export default function ReportsScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { currentUser } = useAuthStore();
  const { mark, measure } = usePerformanceMark();

  const reportsLog = logger.withScope('reports');

  const [reportData, setReportData] = useState<ReportData>({ sales: [], movements: [], topProducts: [] });
  const [ordersHistory, setOrdersHistory] = useState<Order[]>([]);
  const [cashMove, setCashMove] = useState<CashMove>({ type: 'SAIDA', amount: '', description: '' });
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>({ startDate: '', endDate: '' });
  const [advancedReportData, setAdvancedReportData] = useState<ReportData | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({ payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } });

  const loadReports = () => {
    const ipc = getIPC();
    if (ipc) {
      mark('reports:load:start');
      setLoading('Carregando relatórios...');
      Promise.all([
        ipc.invoke('reports:daily'),
        ipc.invoke('orders:get-history'),
      ]).then(([daily, history]) => {
        if (daily?.success) {
          const merged = { ...daily.data };
          setReportData(merged);
          reportsLog.info('reports loaded');
        } else addToast('Erro ao carregar relatório diário', 'error');
        if (history?.success) setOrdersHistory(history.data);
        mark('reports:load:end');
        const duration = measure('reports:load:start', 'reports:load:end');
        if (duration !== null) {
          reportsLog.info('reports load duration', { durationMs: duration });
        }
      }).finally(() => clearLoading());
      const today = new Date().toISOString().split('T')[0];
      loadFinancialSummary(today, today);
    }
  };

  const loadAdvancedReport = () => {
    const ipc = getIPC();
    if (ipc && reportPeriod.startDate && reportPeriod.endDate) {
      setLoading('Carregando relatório...');
      Promise.all([
        ipc.invoke('reports:by-period', reportPeriod),
        ipc.invoke('reports:store-info'),
        ipc.invoke('reports:all-orders-for-period', reportPeriod),
        ipc.invoke('reports:promotions-for-period', reportPeriod),
        ipc.invoke('reports:cash-sessions', reportPeriod),
      ]).then(([period, storeInfo, allOrders, promotions, cashSessions]) => {
        if (period?.success) {
          const merged = { ...period.data };
          if (storeInfo?.success) merged.storeInfo = storeInfo.data;
          if (allOrders?.success) merged.allOrders = allOrders.data;
          if (promotions?.success) merged.promotions = promotions.data;
          if (cashSessions?.success && cashSessions.data?.length) {
            merged.cashSessions = cashSessions.data;
          }
          setAdvancedReportData(merged);
        } else addToast('Erro ao carregar relatório do período', 'error');
      }).finally(() => clearLoading());
      loadFinancialSummary(reportPeriod.startDate, reportPeriod.endDate);
    }
  };

  const loadFinancialSummary = (startDate: string, endDate: string) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('financial:get-summary', { startDate, endDate }).then((res: any) => {
        if (res && res.success) setFinancialSummary(res.data);
        else addToast('Erro ao carregar resumo financeiro', 'error');
      });
    }
  };

  const hasPermission = (action: string) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const permissions: Record<string, string[]> = {
      admin: ['all'],
      manager: ['edit_products', 'delete_products', 'edit_promotions', 'delete_promotions', 'cancel_orders', 'access_settings', 'manage_users'],
      operator: ['view_reports', 'create_orders']
    };
    if (role === 'admin') return true;
    return permissions[role]?.includes(action) || false;
  };

  const runWithAuth = (callback: () => void, requiredPermission: string | null = null) => {
    if (requiredPermission && !hasPermission(requiredPermission)) {
      addToast('Você não tem permissão para realizar esta ação.', 'error');
      return;
    }
    callback();
  };

  useEffect(() => {
    mark('reports:mount:start');
    loadReports();
    mark('reports:mount:end');
    const duration = measure('reports:mount:start', 'reports:mount:end');
    if (duration !== null) {
      reportsLog.info('reports mount duration', { durationMs: duration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReportsModal
      isOpen={true}
      onClose={() => navigate('/pdv')}
      advancedReportData={advancedReportData}
      setAdvancedReportData={setAdvancedReportData as any}
      reportData={reportData}
      reportPeriod={reportPeriod}
      setReportPeriod={setReportPeriod}
      ordersHistory={ordersHistory}
      cashMove={cashMove}
      setCashMove={setCashMove}
      loadReports={loadReports}
      loadAdvancedReport={loadAdvancedReport}
      runWithAuth={runWithAuth}
      getIPC={getIPC}
      financialSummary={financialSummary}
    />
  );
}
