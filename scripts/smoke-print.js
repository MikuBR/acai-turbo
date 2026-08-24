const { printTickets } = '../main.cjs';

(async () => {
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
  console.log('=== KITCHEN ===');
  console.log(result.kitchen.preview || '');
  console.log('=== FRONT ===');
  console.log(result.front.preview || '');
})();
