import { X, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function ReportsModal({ isOpen, onClose, advancedReportData, setAdvancedReportData, reportData, reportPeriod, setReportPeriod, ordersHistory, cashMove, setCashMove, loadReports, loadAdvancedReport, runWithAuth, getIPC }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface z-[900] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-6xl h-[85vh] rounded-2xl border border-border flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 bg-surface-light border-b border-border flex justify-between items-center px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-success">Relatórios</h2>
            <div className="flex gap-2">
              <button onClick={() => { setAdvancedReportData(null); loadReports(); }}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded transition-all ${!advancedReportData ? 'bg-success text-white' : 'bg-surface-light text-muted hover:text-primary'}`}>Hoje</button>
              <button onClick={() => { setAdvancedReportData(null); }}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded transition-all ${advancedReportData ? 'bg-success text-white' : 'bg-surface-light text-muted hover:text-primary'}`}>Período</button>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-danger/20 rounded-md text-muted hover:text-danger transition-all"><X size={20}/></button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[400px] p-6 border-r border-border bg-surface overflow-y-auto custom-scrollbar">
            {advancedReportData ? (
              <>
                <div className="mb-6 p-4 bg-surface-light rounded-xl border border-border">
                  <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Filtrar por Período</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Data Início</label>
                      <input type="date" value={reportPeriod.startDate} onChange={e => setReportPeriod({...reportPeriod, startDate: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase ml-1 mb-1 block">Data Fim</label>
                      <input type="date" value={reportPeriod.endDate} onChange={e => setReportPeriod({...reportPeriod, endDate: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
                    </div>
                    <button onClick={loadAdvancedReport} className="w-full bg-success hover:bg-success py-2 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all">Gerar Relatório</button>
                  </div>
                </div>

                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Métricas Avançadas</h3>
                <div className="space-y-3 mb-6">
                  <div className="bg-success/10 border border-success/30 p-4 rounded-lg">
                    <span className="text-[9px] text-muted font-bold uppercase block">Ticket Médio</span>
                    <span className="text-2xl font-bold text-success font-mono">R$ {advancedReportData.ticketAverage.toFixed(2)}</span>
                  </div>
                  <div className="bg-info/10 border border-info/30 p-4 rounded-lg">
                    <span className="text-[9px] text-muted font-bold uppercase block">Horários de Pico</span>
                    <div className="mt-2 space-y-1">
                      {advancedReportData.peakHours.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-primary">{h.hour}:00</span>
                          <span className="font-bold text-info">{h.order_count} pedidos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Resumo de Vendas</h3>
                <div className="space-y-2 mb-8">
                  {(reportData?.sales || []).map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-surface-light p-3 rounded-lg border border-border">
                      <span className="text-xs font-bold text-primary">{s.payment_method}</span>
                      <span className="font-mono text-success font-bold">R$ {s.total_amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-surface-light p-3 rounded-lg border border-border mt-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Bruto</span>
                    <span className="font-mono text-success font-bold text-lg">R$ {(reportData?.sales || []).reduce((acc, curr) => acc + curr.total_amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Lançamento Manual (Gaveta)</h3>
            <div className="bg-surface-light p-4 rounded-xl border border-border space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCashMove({...cashMove, type: 'ENTRADA'})}
                  className={`py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${cashMove.type === 'ENTRADA' ? 'bg-success/20 text-success border border-success/50' : 'bg-surface-light text-muted border border-border'}`}>
                  <ArrowUpCircle size={14}/> ENTRADA</button>
                <button onClick={() => setCashMove({...cashMove, type: 'SAIDA'})}
                  className={`py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${cashMove.type === 'SAIDA' ? 'bg-danger/20 text-danger border border-danger/50' : 'bg-surface-light text-muted border border-border'}`}>
                  <ArrowDownCircle size={14}/> SANGRIA</button>
              </div>
              <input type="number" step="0.01" placeholder="Valor R$" value={cashMove.amount} onChange={e => setCashMove({...cashMove, amount: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
              <input type="text" placeholder="Motivo (Ex: Troco, Gelo...)" value={cashMove.description} onChange={e => setCashMove({...cashMove, description: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
              <button onClick={() => {
                const ipc = getIPC();
                if(cashMove.amount && cashMove.description && ipc) {
                  ipc.invoke('cash:register', { ...cashMove, amount: parseFloat(cashMove.amount) }).then(() => {
                    setCashMove({ type: 'SAIDA', amount: '', description: '' });
                    loadReports();
                  });
                }
              }} className="w-full bg-surface-light hover:bg-border py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-primary transition-all">
                Registrar Movimento
              </button>
            </div>
            
            {reportData.movements?.length > 0 && (
              <div className="mt-4 space-y-2">
                {reportData.movements.map((m, i) => (
                  <div key={i} className={`flex justify-between text-[10px] p-2 rounded ${m.type === 'ENTRADA' ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                    <span>Total {m.type}</span><span>R$ {m.total_amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col overflow-hidden bg-surface">
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">
              {advancedReportData ? 'Produtos Mais Vendidos (Período)' : 'Histórico de Pedidos (Estorno)'}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {advancedReportData ? (
                advancedReportData.topProducts.map((p, i) => (
                  <div key={i} className="bg-surface-light border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-primary">{p.product_name}</div>
                      <div className="text-[10px] text-muted">{p.qty} vendidos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-success">R$ {p.total_revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              ) : (
                ordersHistory.map(o => (
                  <div key={o.id} className="bg-surface-light border border-border rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-3 border-b border-border pb-3">
                      <div>
                        <span className="font-bold text-sm text-primary mr-3">{o.customer_name} {o.is_delivery ? '🛵' : ''}</span>
                        <span className="text-[10px] bg-surface-light px-2 py-1 rounded text-muted uppercase">{o.payment_method}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-lg text-success">R$ {o.total.toFixed(2)}</span>
                        <button
                          onClick={() => runWithAuth(() => {
                            const ipc = getIPC();
                            if(window.confirm(`Tem certeza que deseja CANCELAR (estornar) o pedido #${o.id} - ${o.customer_name}?`) && ipc) {
                              ipc.invoke('orders:delete', o.id).then(() => loadReports());
                            }
                          }, 'cancel_orders')}
                          className="p-2 bg-danger/10 hover:bg-danger hover:text-white text-danger rounded-lg transition-colors flex items-center gap-2"
                          title="Cancelar Pedido"
                        >
                          <Trash2 size={16} /> <span className="text-[10px] font-bold uppercase hidden xl:block">Estornar</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {o.items.map(i => (
                        <div key={i.id} className="flex justify-between text-[10px] text-muted">
                          <span>1x {i.product_name} <span className="text-muted/70 italic ml-1">{i.notes ? `(${i.notes})` : ''}</span></span>
                          <span className="font-mono">R$ {i.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {ordersHistory.length === 0 && !advancedReportData && <div className="text-center text-muted text-xs mt-10">Nenhuma venda registrada hoje.</div>}
              {advancedReportData && advancedReportData.topProducts.length === 0 && <div className="text-center text-muted text-xs mt-10">Nenhum produto vendido no período.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
