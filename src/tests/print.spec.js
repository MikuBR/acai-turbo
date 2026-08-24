test('printTickets renders kitchen preview matching #32 layout rules', async () => {
  const orderData = {
    tableName: 'MESA 1',
    operatorName: 'Wanderson Silva',
    createdAt: '2026-01-05T15:43:16',
    isDelivery: false,
  };
  const items = [
    { name: 'MONTE SUA COMBINAÇÃO', category: 'SORVETE', notes: 'Paçoca|Leite em pó|Mel', size: '250ML', quantity: 1 },
    { name: 'MONTE SUA COMBINAÇÃO', category: 'SORVETE', notes: 'Paçoca|Morango com calda|Leite condensado', size: '500ML', quantity: 1 },
  ];
  const result = await printTickets(orderData, items);
  expect(result.kitchen.success).toBe(true);
  const preview = result.kitchen.preview || '';
  expect(preview).toContain('AÇAÍ');
  expect(preview).toContain('MESA 1');
  expect(preview).toContain('Operador: Wanderson Silva');
  expect(preview).toContain('Data: 05/01/2026 - 15:43:16');
});
