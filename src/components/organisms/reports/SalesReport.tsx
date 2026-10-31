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
        {topProducts.length > 0 && (
          <svg viewBox="0 0 300 120" className="w-full h-32 mb-2">
            {topProducts.slice(0, 5).map((p, i) => {
              const max = Math.max(...topProducts.slice(0, 5).map(x => x.total_revenue ?? 0), 1);
              const w = ((p.total_revenue ?? 0) / max) * 260;
              const y = i * 22;
              return (
                <g key={i}>
                  <rect x={0} y={y} width={w} height={14} fill="var(--accent-primary, #3b82f6)" rx={3} />
                  <text x={w + 4} y={y + 11} fontSize={9} fill="currentColor">{p.product_name} ({(p.total_revenue ?? 0).toFixed(0)})</text>
                </g>
              );
            })}
          </svg>
        )}
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
        {sales.length > 0 && (
          <svg viewBox="0 0 300 120" className="w-full h-32 mb-2">
            {sales.map((s, i) => {
              const max = Math.max(...sales.map(x => x.total_amount ?? 0), 1);
              const w = ((s.total_amount ?? 0) / max) * 260;
              const y = i * 22;
              return (
                <g key={i}>
                  <rect x={0} y={y} width={w} height={14} fill="#10b981" rx={3} />
                  <text x={w + 4} y={y + 11} fontSize={9} fill="currentColor">{s.payment_method} ({(s.total_amount ?? 0).toFixed(0)})</text>
                </g>
              );
            })}
          </svg>
        )}
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
