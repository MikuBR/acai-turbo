interface FinancialSummary { payable: { pending: number; paid: number; total: number }; receivable: { pending: number; paid: number; total: number } }
interface FinancialReportProps { financialSummary: FinancialSummary | null; onExportPDF: () => void }

export default function FinancialReport({ financialSummary, onExportPDF }: FinancialReportProps) {
  const fs = financialSummary ?? { payable: { pending: 0, paid: 0, total: 0 }, receivable: { pending: 0, paid: 0, total: 0 } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Contas a Pagar e Pagas</h3>
        <button onClick={onExportPDF} className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-success text-white">Exportar PDF</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">A Pagar (Total)</span>
          <span className="text-lg font-bold text-primary">R$ {Number(fs.payable?.total ?? 0).toFixed(2)}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">A Pagar (Pendente)</span>
          <span className="text-lg font-bold text-warning">R$ {Number(fs.payable?.pending ?? 0).toFixed(2)}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">A Receber (Total)</span>
          <span className="text-lg font-bold text-primary">R$ {Number(fs.receivable?.total ?? 0).toFixed(2)}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="text-[9px] text-muted font-bold uppercase block">A Receber (Pendente)</span>
          <span className="text-lg font-bold text-warning">R$ {Number(fs.receivable?.pending ?? 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
