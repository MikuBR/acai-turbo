import { X, Trash2, ArrowUpCircle, ArrowDownCircle, DollarSign, FileDown } from 'lucide-react';
import useToastStore from '../../store/toastStore';

function generatePDF(data, isPeriodView, financialSummary, reportPeriod) {
  const salesTotal = (data?.sales || []).reduce((a, c) => a + Number(c.total_amount || 0), 0);
  const entradasTotal = (data?.movements || []).reduce((a, m) => m.type === 'ENTRADA' ? a + m.total_amount : a, 0);
  const sangriasTotal = (data?.movements || []).reduce((a, m) => m.type === 'SAIDA' ? a + m.total_amount : a, 0);
  const saldoFinal = salesTotal + entradasTotal - sangriasTotal;
  const totalOrders = (data?.sales || []).reduce((a, c) => a + Number(c.order_count || 0), 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const periodLabel = isPeriodView
    ? `Período: ${reportPeriod.startDate} a ${reportPeriod.endDate}`
    : `Data: ${dateStr}`;

  const salesRows = (data?.sales || []).map(s => [
    s.payment_method || 'N/A',
    { text: String(s.order_count || '-'), alignment: 'center' },
    { text: `R$ ${Number(s.total_amount).toFixed(2)}`, alignment: 'right' },
  ]);

  const movementRows = (data?.movements || [])
    .filter(m => m.type === 'ENTRADA' || m.type === 'SAIDA')
    .map(m => [
      {
        text: m.type === 'ENTRADA' ? 'ENTRADA' : 'SAÍDA',
        color: m.type === 'ENTRADA' ? '#16a34a' : '#dc2626',
        bold: true,
      },
      m.description || '-',
      { text: `R$ ${Number(m.total_amount).toFixed(2)}`, alignment: 'right' },
    ]);

  const fin = financialSummary || {};
  const content = [
    { text: 'AÇAÍ WAVE', style: 'title' },
    { text: 'RELATÓRIO FINANCEIRO', style: 'subtitle', margin: [0, 0, 0, 10] },
    { text: periodLabel, style: 'date', margin: [0, 0, 0, 20] },

    { text: '1. RESUMO DE VENDAS', style: 'sectionTitle' },
    {
      style: 'table',
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: 'Forma de Pagamento', style: 'tableHeader' },
            { text: 'Pedidos', style: 'tableHeader', alignment: 'center' },
            { text: 'Total', style: 'tableHeader', alignment: 'right' },
          ],
          ...salesRows,
          [
            { text: 'TOTAL', style: 'totalRow' },
            { text: String(totalOrders), style: 'totalRow', alignment: 'center' },
            { text: `R$ ${salesTotal.toFixed(2)}`, style: 'totalRow', alignment: 'right' },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },

    { text: '2. MOVIMENTAÇÕES DE GAVETA', style: 'sectionTitle', margin: [0, 20, 0, 5] },
    movementRows.length > 0
      ? {
          style: 'table',
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto'],
            body: [
              [
                { text: 'Tipo', style: 'tableHeader' },
                { text: 'Descrição', style: 'tableHeader' },
                { text: 'Valor', style: 'tableHeader', alignment: 'right' },
              ],
              ...movementRows,
            ],
          },
          layout: 'lightHorizontalLines',
        }
      : { text: 'Nenhuma movimentacao registrada.', italics: true, color: '#888', margin: [0, 5, 0, 5] },
    { text: `Total Entradas: R$ ${entradasTotal.toFixed(2)}`, margin: [0, 10, 0, 2], color: '#16a34a', bold: true },
    { text: `Total Saidas:   R$ ${sangriasTotal.toFixed(2)}`, margin: [0, 0, 0, 2], color: '#dc2626', bold: true },

    { text: '3. SALDO DO CAIXA', style: 'sectionTitle', margin: [0, 20, 0, 5] },
    {
      text: `Vendas (R$ ${salesTotal.toFixed(2)}) + Entradas (R$ ${entradasTotal.toFixed(2)}) - Saidas (R$ ${sangriasTotal.toFixed(2)})`,
      fontSize: 9,
      color: '#555',
      margin: [0, 0, 0, 5],
    },
    {
      text: `= R$ ${saldoFinal.toFixed(2)}`,
      style: 'balanceValue',
      color: saldoFinal >= 0 ? '#16a34a' : '#dc2626',
      margin: [0, 0, 0, 20],
    },
  ];

  if (fin.payable) {
    content.push({ text: '4. RESUMO FINANCEIRO', style: 'sectionTitle' });
    content.push({
      style: 'table',
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: '', style: 'tableHeader' },
            { text: 'A Pagar', style: 'tableHeader', alignment: 'right' },
            { text: 'A Receber', style: 'tableHeader', alignment: 'right' },
          ],
          [
            { text: 'Pendente' },
            { text: `R$ ${(fin.payable?.pending || 0).toFixed(2)}`, alignment: 'right' },
            { text: `R$ ${(fin.receivable?.pending || 0).toFixed(2)}`, alignment: 'right' },
          ],
          [
            { text: 'Pago' },
            { text: `R$ ${(fin.payable?.paid || 0).toFixed(2)}`, alignment: 'right' },
            { text: `R$ ${(fin.receivable?.paid || 0).toFixed(2)}`, alignment: 'right' },
          ],
          [
            { text: 'Total', style: 'totalRow' },
            { text: `R$ ${(fin.payable?.total || 0).toFixed(2)}`, style: 'totalRow', alignment: 'right' },
            { text: `R$ ${(fin.receivable?.total || 0).toFixed(2)}`, style: 'totalRow', alignment: 'right' },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    });
  }

  if (isPeriodView && data) {
    content.push({ text: '5. METRICAS DO PERIODO', style: 'sectionTitle', margin: [0, 20, 0, 5] });

    if (data.ticketAverage !== undefined) {
      content.push({
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            stack: [
              { text: 'Ticket Medio', fontSize: 9, color: '#555' },
              { text: `R$ ${Number(data.ticketAverage).toFixed(2)}`, fontSize: 16, bold: true, alignment: 'center', color: '#16a34a', margin: [0, 5, 0, 15] },
            ],
            alignment: 'center',
          },
          { width: '*', text: '' },
        ],
      });
    }

    if (data.topProducts && data.topProducts.length > 0) {
      content.push({ text: 'Produtos Mais Vendidos', fontSize: 10, bold: true, margin: [0, 10, 0, 5] });
      content.push({
        style: 'table',
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Produto', style: 'tableHeader' },
              { text: 'Qtd', style: 'tableHeader', alignment: 'center' },
              { text: 'Receita', style: 'tableHeader', alignment: 'right' },
            ],
            ...data.topProducts.map(p => [
              p.product_name,
              { text: String(p.qty), alignment: 'center' },
              { text: `R$ ${Number(p.total_revenue || 0).toFixed(2)}`, alignment: 'right' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }

    if (data.peakHours && data.peakHours.length > 0) {
      content.push({ text: 'Horarios de Pico', fontSize: 10, bold: true, margin: [0, 15, 0, 5] });
      content.push({
        style: 'table',
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Hora', style: 'tableHeader' },
              { text: 'Pedidos', style: 'tableHeader', alignment: 'center' },
              { text: 'Valor', style: 'tableHeader', alignment: 'right' },
            ],
            ...data.peakHours.map(h => [
              { text: `${h.hour}:00`, alignment: 'center' },
              { text: String(h.order_count), alignment: 'center' },
              { text: `R$ ${Number(h.total_amount || 0).toFixed(2)}`, alignment: 'right' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      });
    }
  }

  content.push({ text: `Gerado em: ${dateStr} as ${timeStr}`, style: 'footerNote', margin: [0, 30, 0, 0] });
  content.push({ text: 'Acai Wave - PDV', style: 'footerNote' });

  return {
    info: {
      title: `Relatorio Financeiro - ${periodLabel}`,
      author: 'Acai Wave',
      subject: 'Relatorio Financeiro',
    },
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    header: () => ({
      text: 'Acai Wave - Relatorio Financeiro',
      alignment: 'center',
      fontSize: 8,
      color: '#888888',
      margin: [40, 10, 40, 0],
    }),
    footer: (currentPage, pageCount) => ({
      text: `Pagina ${currentPage} de ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#888888',
      margin: [0, 10, 0, 0],
    }),
    content,
    styles: {
      title: { fontSize: 20, bold: true, alignment: 'center', color: '#1a1a1a' },
      subtitle: { fontSize: 13, alignment: 'center', color: '#444444' },
      date: { fontSize: 10, alignment: 'center', color: '#666666' },
      sectionTitle: { fontSize: 12, bold: true, margin: [0, 15, 0, 5], color: '#1a56db' },
      tableHeader: { bold: true, fontSize: 9, fillColor: '#f3f4f6', color: '#374151' },
      totalRow: { bold: true, fontSize: 10, color: '#111827' },
      balanceValue: { fontSize: 16, bold: true, alignment: 'center' },
      footerNote: { fontSize: 8, color: '#888888', alignment: 'center' },
    },
    defaultStyle: { fontSize: 9, color: '#333333' },
  };
}

export default function ReportsModal({ isOpen, onClose, advancedReportData, setAdvancedReportData, reportData, reportPeriod, setReportPeriod, ordersHistory, cashMove, setCashMove, loadReports, loadAdvancedReport, runWithAuth, getIPC, financialSummary }) {
  const addToast = useToastStore(s => s.addToast);
  if (!isOpen) return null;

  const isPeriodView = !!advancedReportData;
  const data = isPeriodView ? advancedReportData : reportData;

  const salesTotal = (data?.sales || []).reduce((a, c) => a + Number(c.total_amount || 0), 0);
  const entradasTotal = (data?.movements || []).reduce((a, m) => m.type === 'ENTRADA' ? a + m.total_amount : a, 0);
  const sangriasTotal = (data?.movements || []).reduce((a, m) => m.type === 'SAIDA' ? a + m.total_amount : a, 0);
  const saldoFinal = salesTotal + entradasTotal - sangriasTotal;

  const handleExportPDF = async () => {
    const ipc = getIPC();
    if (!ipc) { addToast('Sem conexao com o sistema', 'error'); return; }

    const docDef = generatePDF(data, isPeriodView, financialSummary, reportPeriod);
    const now = new Date();
    const datePart = now.toISOString().split('T')[0];
    const defaultName = `relatorio-financeiro-${datePart}.pdf`;

    try {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      const pdfMake = pdfMakeModule.default;
      pdfMake.vfs = pdfFontsModule.default;

      pdfMake.createPdf(docDef).getBase64((base64) => {
        ipc.invoke('dialog:save-pdf', { data: base64, defaultName }).then(res => {
          if (res.success) {
            addToast(`PDF salvo em: ${res.path}`, 'success');
          } else if (res.error) {
            addToast(`Erro ao salvar PDF: ${res.error}`, 'error');
          }
        });
      });
    } catch (e) {
      addToast('Erro ao carregar gerador de PDF', 'error');
      console.error('[pdf] Erro ao carregar pdfmake:', e);
    }
  };

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
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="p-1.5 hover:bg-success/20 rounded-md text-muted hover:text-success transition-all" title="Exportar PDF">
              <FileDown size={20}/>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-danger/20 rounded-md text-muted hover:text-danger transition-all"><X size={20}/></button>
          </div>
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
                if(!ipc) { addToast('Sem conexão com o sistema', 'error'); return; }
                if(!cashMove.amount) { addToast('Informe o valor', 'warning'); return; }
                if(!cashMove.description) { addToast('Informe o motivo', 'warning'); return; }
                ipc.invoke('cash:register', { ...cashMove, amount: parseFloat(cashMove.amount) }).then(res => {
                  if (res.success) {
                    addToast('Movimento registrado com sucesso!', 'success');
                    setCashMove({ type: 'SAIDA', amount: '', description: '' });
                    loadReports();
                    if (advancedReportData) loadAdvancedReport();
                  } else {
                    addToast(res.error, 'error');
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
