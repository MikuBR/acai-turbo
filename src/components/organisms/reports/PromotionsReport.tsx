interface Promotion { id: number; name: string; type: string; value: number; start_date?: string; end_date?: string }
interface PromotionsReportProps { promotions: Promotion[] | null; onExportPDF: () => void }

export default function PromotionsReport({ promotions, onExportPDF }: PromotionsReportProps) {
  const list = promotions ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Promoções Ativas</h3>
        <button onClick={onExportPDF} className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-success text-white">Exportar PDF</button>
      </div>
      <table className="w-full text-xs">
        <thead><tr className="text-left text-muted"><th>Nome</th><th>Tipo</th><th>Valor</th><th>Vigência</th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="py-1">{p.name}</td>
              <td className="py-1">{p.type}</td>
              <td className="py-1">{p.value}</td>
              <td className="py-1">{p.start_date} → {p.end_date}</td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={4} className="py-2 text-muted">Nenhuma promoção no período.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
