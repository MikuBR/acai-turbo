interface Order { id: number; customer_name: string; total: number; is_delivery: boolean; payment_method: string; created_at: string; items?: Array<{ product_name: string; price: number }> }
interface DeliveryReportProps { orders: Order[] | null; onExportPDF: () => void }

export default function DeliveryReport({ orders, onExportPDF }: DeliveryReportProps) {
  const list = (orders ?? []).filter((o) => o.is_delivery);
  const total = list.reduce((s, o) => s + (o.total ?? 0), 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Relatório de Delivery</h3>
        <button onClick={onExportPDF} className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-success text-white">Exportar PDF</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">Pedidos Delivery</span>
          <span className="text-lg font-bold text-primary">{list.length}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">Total Delivery</span>
          <span className="text-lg font-bold text-primary">R$ {total.toFixed(2)}</span>
        </div>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="text-left text-muted"><th>#</th><th>Cliente</th><th>Pagamento</th><th>Total</th><th>Data</th></tr></thead>
        <tbody>
          {list.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="py-1">{o.id}</td>
              <td className="py-1">{o.customer_name}</td>
              <td className="py-1">{o.payment_method}</td>
              <td className="py-1">R$ {(o.total ?? 0).toFixed(2)}</td>
              <td className="py-1">{o.created_at}</td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={5} className="py-2 text-muted">Nenhum pedido delivery no período.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
