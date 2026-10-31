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
});