test('printTickets preserves PT-BR accents in #32 format', async () => {
  const orderData = { tableName: 'MESA 1', operatorName: 'João Silva', createdAt: '2026-01-05T15:43:16', isDelivery: false };
  const items = [{ name: 'Açaí', category: 'SORVETE', notes: 'Sem açúcar', size: '500ML', quantity: 1 }];
  const result = await printTickets(orderData, items);
  const preview = result.kitchen.preview || '';
  expect(preview).toContain('Açaí');
  expect(preview).toContain('Sem açúcar');
});
