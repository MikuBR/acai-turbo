interface Product { id: number; name: string; price: number; category: string; stock?: number }
interface CatalogReportProps { products: Product[] | null; onExportPDF: () => void }

export default function CatalogReport({ products, onExportPDF }: CatalogReportProps) {
  const list = products ?? [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Relatório de Produtos Cadastrados</h3>
        <button onClick={onExportPDF} className="text-[10px] font-bold uppercase px-3 py-1 rounded bg-success text-white">Exportar PDF</button>
      </div>
      <div className="text-[10px] text-muted">Total de produtos: {list.length}</div>
      <table className="w-full text-xs">
        <thead><tr className="text-left text-muted"><th>Nome</th><th>Categoria</th><th>Preço</th><th>Estoque</th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="py-1">{p.name}</td>
              <td className="py-1">{p.category}</td>
              <td className="py-1">R$ {(p.price ?? 0).toFixed(2)}</td>
              <td className="py-1">{p.stock ?? '-'}</td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={4} className="py-2 text-muted">Nenhum produto cadastrado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
