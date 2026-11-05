import { describe, it, expect } from 'vitest';
import * as ph from '../../main/print-helpers.cjs';

describe('print-helpers', () => {
  it('safeUpper handles null/undefined/numbers', () => {
    expect(ph.safeUpper(null)).toBe('');
    expect(ph.safeUpper(undefined)).toBe('');
    expect(ph.safeUpper('bebida')).toBe('BEBIDA');
    expect(ph.safeUpper(123)).toBe('123');
  });

  it('classifyItems separates drinks from kitchen items', () => {
    const items = [
      { name: 'Açaí', category: 'AÇAÍ' },
      { name: 'Coca', category: 'BEBIDA' },
      { name: 'X', category: null },
      { name: 'Chopp', category: 'CHOPP' },
    ];
    const r = ph.classifyItems(items);
    expect(r.kitchenItems.map(i => i.name)).toEqual(['Açaí', 'X']);
    expect(r.frontItems.map(i => i.name)).toEqual(['Coca', 'Chopp']);
  });

  it('classifyItems handles null/empty input', () => {
    expect(ph.classifyItems(null)).toEqual({ kitchenItems: [], frontItems: [] });
    expect(ph.classifyItems([])).toEqual({ kitchenItems: [], frontItems: [] });
  });

  it('receiptDate returns empty for invalid iso', () => {
    expect(ph.receiptDate('not-a-date')).toBe('');
    expect(ph.receiptDate(null)).not.toBe('');
  });

  it('buildKitchenText does not crash on null fields', () => {
    const txt = ph.buildKitchenText(null, [{ name: null, category: null, quantity: 2 }]);
    expect(txt).toContain('AÇAÍ');
  });

  it('buildKitchenText includes delivery info', () => {
    const txt = ph.buildKitchenText({ isDelivery: true, tableName: 'João', phone: '999', createdAt: '2026-01-01T10:00:00' }, [{ name: 'Açaí', quantity: 1, size: '300ml' }]);
    expect(txt).toContain('** DELIVERY **');
    expect(txt).toContain('Cliente: JOÃO');
    expect(txt).toContain('Tel: 999');
  });

  it('buildKitchenText imprime comanda delivery completa (cliente, tel, end, itens, data)', () => {
    const orderData = {
      isDelivery: true,
      tableName: 'João',
      phone: '11999999999',
      address: 'Rua X, 123',
      operatorName: 'Maria',
      createdAt: '2026-11-05T14:30:00',
    };
    const items = [{ quantity: 2, name: 'Açaí 500ml', size: '500ml', notes: 'sem granola' }];
    const txt = ph.buildKitchenText(orderData, items);
    expect(txt).toContain('** DELIVERY **');
    expect(txt).toContain('JOÃO');
    expect(txt).toContain('11999999999');
    expect(txt).toContain('RUA X, 123');
    expect(txt).toContain('AÇAÍ 500ML');
    expect(txt).toContain('sem granola');
    expect(txt).toContain('Operador: Maria');
    // data formatada dd/mm/aaaa (aa = ano)
    expect(txt).toMatch(/\b05\/11\/2026\b/);
  });

  it('receiptDate formata como dd/mm/aaaa hh:mm:ss', () => {
    expect(ph.receiptDate('2026-11-05T14:30:00')).toMatch(/^\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}:\d{2}$/);
    expect(ph.receiptDate('2026-11-05T14:30:00')).toContain('05/11/2026');
  });
});