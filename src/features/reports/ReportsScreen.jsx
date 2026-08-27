import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import useLoadingStore from '../../store/loadingStore';
import { getIPC } from '../../services/ipc.js';
import logger from '../../services/logger.js';
import ReportsModal from '../../components/organisms/ReportsModal.jsx';

export default function ReportsScreen() {
  const navigate = useNavigate();
  const addToast = useToastStore(s => s.addToast);
  const { setLoading, clearLoading } = useLoadingStore();
  const { currentUser } = useAuthStore();

  const reportsLog = logger.withScope('reports');

  const [reportData, setReportData] = useState({ sales: [], movements: [], topProducts: [] });
  const [ordersHistory, setOrdersHistory] = useState([]);
  const [cashMove, setCashMove] = useState({ type: 'SAIDA', amount: '', description: '' });
  const [reportPeriod, setReportPeriod] = useState({ startDate: '', endDate: '' });
  const [advancedReportData, setAdvancedReportData] = useState(null);
  const [financialSummary, setFinancialSummary] = useState({ payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } });

  const loadReports = () => {
    const ipc = getIPC();
    if (ipc) {
      setLoading('Carregando relatórios...');
      Promise.all([
        ipc.invoke('reports:daily'),
        ipc.invoke('orders:get-history'),
      ]).then(([daily, history]) => {
        if (daily?.success) { setReportData(daily.data); reportsLog.info('reports loaded'); }
        else addToast('Erro ao carregar relatório diário', 'error');
        if (history?.success) setOrdersHistory(history.data);
      }).finally(() => clearLoading());
      const today = new Date().toISOString().split('T')[0];
      loadFinancialSummary(today, today);
    }
  };

  const loadAdvancedReport = () => {
    const ipc = getIPC();
    if (ipc && reportPeriod.startDate && reportPeriod.endDate) {
      setLoading('Carregando relatório...');
      ipc.invoke('reports:by-period', reportPeriod).then(res => {
        if (res && res.success) setAdvancedReportData(res.data);
        else addToast('Erro ao carregar relatório do período', 'error');
      }).finally(() => clearLoading());
      loadFinancialSummary(reportPeriod.startDate, reportPeriod.endDate);
    }
  };

  const loadFinancialSummary = (startDate, endDate) => {
    const ipc = getIPC();
    if (ipc) {
      ipc.invoke('financial:get-summary', { startDate, endDate }).then(res => {
        if (res && res.success) setFinancialSummary(res.data);
        else addToast('Erro ao carregar resumo financeiro', 'error');
      });
    }
  };

  const hasPermission = (action) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const permissions = {
      admin: ['all'],
      manager: ['edit_products', 'delete_products', 'edit_promotions', 'delete_promotions', 'cancel_orders', 'access_settings', 'manage_users'],
      operator: ['view_reports', 'create_orders']
    };
    if (role === 'admin') return true;
    return permissions[role]?.includes(action) || false;
  };

  const runWithAuth = (callback, requiredPermission = null) => {
    if (requiredPermission && !hasPermission(requiredPermission)) {
      addToast('Você não tem permissão para realizar esta ação.', 'error');
      return;
    }
    callback();
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReportsModal
      isOpen={true}
      onClose={() => navigate('/pdv')}
      advancedReportData={advancedReportData}
      setAdvancedReportData={setAdvancedReportData}
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
