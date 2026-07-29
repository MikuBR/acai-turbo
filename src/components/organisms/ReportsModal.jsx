import { X, Trash2, ArrowUpCircle, ArrowDownCircle, DollarSign } from 'lucide-react';

export default function ReportsModal({ isOpen, onClose, advancedReportData, setAdvancedReportData, reportData, reportPeriod, setReportPeriod, ordersHistory, cashMove, setCashMove, loadReports, loadAdvancedReport, runWithAuth, getIPC, financialSummary }) {
  if (!isOpen) return null;

  const isPeriodView = !!advancedReportData;
  const data = isPeriodView ? advancedReportData : reportData;

  const salesTotal = (data?.sales || []).reduce((a, c) => a + Number(c.total_amount || 0), 0);
  const entradasTotal = (data?.movements || []).reduce((a, m) => m.type === 'ENTRADA' ? a + m.total_amount : a, 0);
  const sangriasTotal = (data?.movements || []).reduce((a, m) => m.type === 'SAIDA' ? a + m.total_amount : a, 0);
  const saldoFinal = salesTotal + entradasTotal - sangriasTotal;

  return (
    <div className="fixed inset-0 bg-surface z-[900] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-6xl h-[85vh] rounded-2xl border border-border flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 bg-surface-light border-b border-border flex justify-between items-center px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-success">Relatórios</h2>
            <div className="flex gap-2">
              <button onClick={() => { setAdvancedReportData(null); loadReports(); }}
                className={`text-[10px] font-bold uppercase px-3 py-1 rounded transition-all ${!advancedReportData ? 'bg-success text-white' : 'bg-surface-light text-muted hover:text-primary'}`}>Hoje</button>
              <button onClick={() => { 
                setAdvancedReportData(null); 
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                setReportPeriod({ 
                  startDate: thirtyDaysAgo.toISOString().split('T')[0], 
                  endDate: today.toISOString().split('T')[0] 
                });
                loadAdvancedReport();
              }}
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

                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Resumo de Vendas (Período)</h3>
                <div className="space-y-2 mb-8">
                  {(data?.sales || []).map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-surface-light p-3 rounded-lg border border-border">
                      <span className="text-xs font-bold text-primary">{s.payment_method}</span>
                      <span className="font-mono text-success font-bold">R$ {s.total_amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-surface-light p-3 rounded-lg border border-border mt-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Vendas</span>
                    <span className="font-mono text-success font-bold text-lg">R$ {salesTotal.toFixed(2)}</span>
                  </div>
                  {(data?.movements || []).filter(m => m.type === 'ENTRADA' || m.type === 'SAIDA').map((m, i) => (
                    <div key={m.id || i} className={`flex justify-between items-center p-3 rounded-lg border ${m.type === 'ENTRADA' ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">{m.type === 'ENTRADA' ? '➕ Entrada' : '➖ Sangria'}</span>
                        <span className="text-[10px] text-muted">{m.description}</span>
                        <span className="text-[9px] text-muted/60">{m.created_at ? new Date(m.created_at + 'Z').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <span className={`font-mono font-bold ${m.type === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>R$ {m.total_amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-3 rounded-lg mt-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Saldo do Caixa</span>
                    <span className={`font-mono font-bold text-lg ${saldoFinal >= 0 ? 'text-success' : 'text-danger'}`}>R$ {saldoFinal.toFixed(2)}</span>
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
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Total Vendas</span>
                    <span className="font-mono text-success font-bold text-lg">R$ {salesTotal.toFixed(2)}</span>
                  </div>
                  {(data?.movements || []).filter(m => m.type === 'ENTRADA' || m.type === 'SAIDA').map((m, i) => (
                    <div key={m.id || i} className={`flex justify-between items-center p-3 rounded-lg border ${m.type === 'ENTRADA' ? 'bg-success/5 border-success/20' : 'bg-danger/5 border-danger/20'}`}>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">{m.type === 'ENTRADA' ? '➕ Entrada' : '➖ Sangria'}</span>
                        <span className="text-[10px] text-muted">{m.description}</span>
                        <span className="text-[9px] text-muted/60">{m.created_at ? new Date(m.created_at + 'Z').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <span className={`font-mono font-bold ${m.type === 'ENTRADA' ? 'text-success' : 'text-danger'}`}>R$ {m.total_amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-3 rounded-lg mt-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Saldo do Caixa</span>
                    <span className={`font-mono font-bold text-lg ${saldoFinal >= 0 ? 'text-success' : 'text-danger'}`}>R$ {saldoFinal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {/* Financial Summary - Today */}
            {financialSummary && (
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2 flex items-center gap-2">
                  <DollarSign size={12} className="text-warning" />
                  Resumo Financeiro
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg">
                    <span className="text-[9px] text-muted font-bold uppercase block">A Pagar (Total)</span>
                    <span className="text-lg font-bold text-warning font-mono">R$ {financialSummary.payable?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-success/10 border border-success/30 p-3 rounded-lg">
                    <span className="text-[9px] text-muted font-bold uppercase block">A Receber (Total)</span>
                    <span className="text-lg font-bold text-success font-mono">R$ {financialSummary.receivable?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-danger/10 border border-danger/30 p-3 rounded-lg">
                    <span className="text-[9px] text-muted font-bold uppercase block">A Pagar (Pendente)</span>
                    <span className="text-lg font-bold text-danger font-mono">R$ {financialSummary.payable?.pending?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="bg-info/10 border border-info/30 p-3 rounded-lg">
                    <span className="text-[9px] text-muted font-bold uppercase block">A Receber (Pendente)</span>
                    <span className="text-lg font-bold text-info font-mono">R$ {financialSummary.receivable?.pending?.toFixed(2) || '0.00'}</span>
</div>
                </div>
              </div>
            )}

              <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 border-b border-border pb-2">Lançamento Manual (Gaveta)</h3>
            <div className="bg-surface-light p-4 rounded-xl border border-border space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCashMove({...cashMove, type: 'ENTRADA'})}
                  className={`py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${cashMove.type === 'ENTRADA' ? 'bg-success/20 text-success border border-success/50' : 'bg-surface-light text-muted border border-border'}`}>
                  <ArrowUpCircle size={14}/> ENTRADA</button>
                <button type="button" onClick={() => setCashMove({...cashMove, type: 'SAIDA'})}
                  className={`py-2 rounded font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${cashMove.type === 'SAIDA' ? 'bg-danger/20 text-danger border border-danger/50' : 'bg-surface-light text-muted border border-border'}`}>
                  <ArrowDownCircle size={14}/> SANGRIA</button>
              </div>
              <input type="number" step="0.01" placeholder="Valor R$" value={cashMove.amount} onChange={e => setCashMove({...cashMove, amount: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
              <input type="text" placeholder="Motivo (Ex: Troco, Gelo...)" value={cashMove.description} onChange={e => setCashMove({...cashMove, description: e.target.value})} className="w-full bg-card border border-border p-3 rounded-lg text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium shadow-sm" />
              <button type="button" onClick={() => {
                const ipc = getIPC();
                if(!ipc) { alert('Sem conexão com o sistema'); return; }
                if(!cashMove.amount) { alert('Informe o valor'); return; }
                if(!cashMove.description) { alert('Informe o motivo'); return; }
                ipc.invoke('cash:register', { ...cashMove, amount: parseFloat(cashMove.amount) }).then(res => {
                  if (res.success) {
                    setCashMove({ type: 'SAIDA', amount: '', description: '' });
                    loadReports();
                    if (advancedReportData) loadAdvancedReport();
                  } else {
                    alert(res.error);
                  }
                });
              }} className="w-full bg-success hover:bg-success py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all">
                Registrar Movimento
              </button>
            </div>
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
                              ipc.invoke('orders:delete', o.id).then(() => {
                                loadReports();
                                if (advancedReportData) loadAdvancedReport();
                              });
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
