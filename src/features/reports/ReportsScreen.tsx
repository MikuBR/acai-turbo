import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import useToastStore from '../../store/toastStore'
import useLoadingStore from '../../store/loadingStore'
import { getIPC } from '../../services/ipc.js'
import logger from '../../services/logger.js'
import ReportsModal from '../../components/organisms/ReportsModal.tsx'
import { SalesReport, PromotionsReport, DeliveryReport, CatalogReport, FinancialReport } from '../../components/organisms/reports'
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

export interface ReportData {
  sales: Sale[]
  movements: Movement[]
  topProducts: TopProduct[]
  promotions?: Promotion[]
  allOrders?: Order[]
}

export interface Order {
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

interface Promotion { id: number; name: string; type: string; value: number; start_date?: string; end_date?: string }
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
  const [activeTab, setActiveTab] = useState<'sales' | 'promotions' | 'delivery' | 'catalog' | 'financial'>('sales');
  const [products, setProducts] = useState<any[]>([]);
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
        ipc.invoke('catalog:get-products'),
        ipc.invoke('promotions:get'),
      ]).then(([daily, history, productsRes, promotionsRes]) => {
        if (daily?.success) {
          const merged = { ...daily.data };
          if (promotionsRes?.success) merged.promotions = promotionsRes.data;
          setReportData(merged);
          reportsLog.info('reports loaded');
        } else addToast('Erro ao carregar relatório diário', 'error');
        if (history?.success) setOrdersHistory(history.data);
        if (productsRes?.success) setProducts(productsRes.data || []);
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

  const handleExportPDF = async () => {
    const addToastLocal = (msg: string, type: string) => addToast(msg, type as any);
    const now = new Date();
    const datePart = now.toISOString().split('T')[0];
    const defaultName = `relatorio-${activeTab}-${datePart}.pdf`;
    try {
      const pdfMakeModule: any = await import('pdfmake/build/pdfmake');
      const pdfFontsModule: any = await import('pdfmake/build/vfs_fonts');
      const pdfMake = pdfMakeModule.default;
      pdfMake.vfs = pdfFontsModule.default;

      const docDef = {
        content: [
          { text: 'Relatório - Açaí Wave', style: 'header' },
          { text: `Aba: ${activeTab}`, margin: [0, 4, 0, 4] },
          { text: `Gerado em: ${now.toLocaleString('pt-BR')}`, margin: [0, 0, 0, 12] },
        ],
        styles: { header: { fontSize: 16, bold: true } },
      };

      const base64 = await pdfMake.createPdf(docDef).getBase64();
      if (!base64) {
        addToastLocal('Erro ao gerar PDF: documento vazio', 'error');
        return;
      }
      const ipc = getIPC();
      if (!ipc) {
        addToastLocal('IPC indisponível', 'error');
        return;
      }
      const res = await ipc.invoke('dialog:save-pdf', { data: base64, defaultName });
      if (res?.success) addToastLocal(`PDF salvo em: ${res.path}`, 'success');
      else if (res?.error) addToastLocal(`Erro ao salvar PDF: ${res.error}`, 'error');
      else if (res?.canceled) addToastLocal('Salvamento de PDF cancelado', 'info');
      else addToastLocal('Erro desconhecido ao salvar PDF', 'error');
    } catch (e: any) {
      console.error('[pdf] Erro ao gerar/salvar PDF:', e);
      addToastLocal('Erro ao exportar PDF', 'error');
    }
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
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate('/pdv')} className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-surface-light text-muted hover:bg-danger/20">Voltar</button>
        {(['sales','promotions','delivery','catalog','financial'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`text-[10px] font-bold uppercase px-3 py-1 rounded ${activeTab === t ? 'bg-success text-white' : 'bg-surface-light text-muted'}`}>{t}</button>
        ))}
      </div>
      <div className="flex gap-3 items-end">
        <div>
          <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Data Início</label>
          <input type="date" value={reportPeriod.startDate} onChange={(e) => setReportPeriod({ ...reportPeriod, startDate: e.target.value })} className="bg-surface border border-border rounded px-2 py-1 text-xs" />
        </div>
        <div>
          <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Data Fim</label>
          <input type="date" value={reportPeriod.endDate} onChange={(e) => setReportPeriod({ ...reportPeriod, endDate: e.target.value })} className="bg-surface border border-border rounded px-2 py-1 text-xs" />
        </div>
        <button onClick={loadAdvancedReport} className="bg-success hover:bg-success py-1 px-3 rounded font-bold text-xs uppercase text-white">Gerar</button>
      </div>
      <div className="bg-surface rounded-lg p-4 border border-border">
        {activeTab === 'sales' && <SalesReport reportData={reportData} advancedReportData={advancedReportData} onExportPDF={handleExportPDF} />}
        {activeTab === 'promotions' && <PromotionsReport promotions={reportData?.promotions ?? advancedReportData?.promotions ?? null} onExportPDF={handleExportPDF} />}
        {activeTab === 'delivery' && <DeliveryReport orders={advancedReportData?.allOrders ?? ordersHistory} onExportPDF={handleExportPDF} />}
        {activeTab === 'catalog' && <CatalogReport products={products} onExportPDF={handleExportPDF} />}
        {activeTab === 'financial' && <FinancialReport financialSummary={financialSummary} onExportPDF={handleExportPDF} />}
      </div>
    </div>
  );
}
