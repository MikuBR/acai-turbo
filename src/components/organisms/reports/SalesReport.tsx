import type { ReportData, Order } from '../../../features/reports/ReportsScreen';

interface SalesReportProps {
  reportData: ReportData | null;
  advancedReportData: ReportData | null;
  onExportPDF: () => void;
}

export default function SalesReport({ reportData, advancedReportData, onExportPDF }: SalesReportProps) {
  const data = advancedReportData ?? reportData;
  const sales = data?.sales ?? [];
  const topProducts = data?.topProducts ?? [];
  const totalSales = sales.reduce((s, x) => s + (x.total_amount ?? 0), 0);
  const totalOrders = sales.reduce((s, x) => s + (x.order_count ?? 0), 0);
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Relatório de Vendas</h3>
        <button onClick={onExportPDF} className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-success text-white">Exportar PDF</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">Total Vendas</span>
          <span className="text-lg font-bold text-primary">R$ {totalSales.toFixed(2)}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">Pedidos</span>
          <span className="text-lg font-bold text-primary">{totalOrders}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">Ticket Médio</span>
          <span className="text-lg font-bold text-primary">R$ {avgTicket.toFixed(2)}</span>
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Itens Mais Vendidos</h4>
        <table className="w-full text-xs">
          <thead><tr className="text-left text-muted"><th>Produto</th><th>Qtd</th><th>Receita</th></tr></thead>
          <tbody>
            {topProducts.map((p, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-1">{p.product_name}</td>
                <td className="py-1">{p.qty}</td>
                <td className="py-1">R$ {(p.total_revenue ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Formas de Pagamento</h4>
        <table className="w-full text-xs">
          <thead><tr className="text-left text-muted"><th>Método</th><th>Pedidos</th><th>Total</th></tr></thead>
          <tbody>
            {sales.map((s, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-1">{s.payment_method}</td>
                <td className="py-1">{s.order_count}</td>
                <td className="py-1">R$ {(s.total_amount ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
