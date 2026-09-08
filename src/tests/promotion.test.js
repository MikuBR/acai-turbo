import { describe, it, expect } from 'vitest';
import {
  calculateDiscount,
  calculateBuyXGetYDiscount,
  getQualifyingItems,
  isPromotionEligible,
  formatPromotionLabel,
} from '../utils/promotion.js';

const item = (over = {}) => ({ id: 1, name: 'Açaí', price: 10, category: 'COPOS DE AÇAÍ', ...over });

describe('promotion.calculateDiscount — PERCENTAGE', () => {
  it('applies the percentage to the table total', () => {
    expect(calculateDiscount({ type: 'PERCENTAGE', value: 10 }, 100)).toBe(10);
  });

  it('rounds to cents and ignores items (not required)', () => {
    expect(calculateDiscount({ type: 'PERCENTAGE', value: 7.5 }, 100)).toBe(7.5);
    expect(calculateDiscount({ type: 'PERCENTAGE', value: 33.33 }, 30)).toBe(10);
    expect(calculateDiscount({ type: 'PERCENTAGE', value: 100 }, 42.5)).toBe(42.5);
  });

  it('clamps negative totals to zero', () => {
    expect(calculateDiscount({ type: 'PERCENTAGE', value: 50 }, -50)).toBe(0);
  });
});

describe('promotion.calculateDiscount — FIXED_AMOUNT', () => {
  it('subtracts the fixed value', () => {
    expect(calculateDiscount({ type: 'FIXED_AMOUNT', value: 5 }, 20)).toBe(5);
  });

  it('never exceeds the table total', () => {
    expect(calculateDiscount({ type: 'FIXED_AMOUNT', value: 50 }, 20)).toBe(20);
  });

  it('handles string values from the settings form', () => {
    expect(calculateDiscount({ type: 'FIXED_AMOUNT', value: '7.50' }, 20)).toBe(7.5);
  });
});

describe('promotion.calculateDiscount — BUY_X_GET_Y', () => {
  const promo = { type: 'BUY_X_GET_Y', value: 10, min_quantity: 2, applies_to: 'ALL' };

  it('returns 0 below the activation threshold (X)', () => {
    expect(calculateDiscount(promo, 10, [item()])).toBe(0);
  });

  it('free-izes one item per completed group of X', () => {
    // 3 itens de R$ 10, X = 2 → o 3º item é grátis ⇒ R$ 10 de desconto.
    const items = [item({ id: 1 }), item({ id: 2 }), item({ id: 3 })];
    expect(calculateBuyXGetYDiscount(items, promo)).toBe(10);
    expect(calculateDiscount(promo, 30, items)).toBe(10);
  });

  it('scales across multiple groups (every X+1 items)', () => {
    // X = 2 ⇒ item grátis nas posições 3 e 6.
    const five = [1, 2, 3, 4, 5].map(n => item({ id: n }));
    const six = [1, 2, 3, 4, 5, 6].map(n => item({ id: n }));
    expect(calculateBuyXGetYDiscount(five, promo)).toBe(10);
    expect(calculateBuyXGetYDiscount(six, promo)).toBe(20);
  });

  it('supports X = 1 (every second item is free)', () => {
    const promo1 = { type: 'BUY_X_GET_Y', value: 10, min_quantity: 1, applies_to: 'ALL' };
    expect(calculateBuyXGetYDiscount([item()], promo1)).toBe(0);
    expect(calculateBuyXGetYDiscount([item(), item()], promo1)).toBe(10);
    expect(calculateBuyXGetYDiscount([item(), item(), item(), item()], promo1)).toBe(20);
  });

  it('caps the free-item discount at its own price (partial discount)', () => {
    // value = 10 mas o item do grupo custa 6 ⇒ só R$ 6 abatidos.
    const items = [item({ id: 1 }), item({ id: 2 }), item({ id: 3, price: 6 })];
    expect(calculateBuyXGetYDiscount(items, promo)).toBe(6);
  });

  it('treats value 0 as fully free', () => {
    const promoFree = { type: 'BUY_X_GET_Y', value: 0, min_quantity: 2, applies_to: 'ALL' };
    const items = [item({ id: 1, price: 10 }), item({ id: 2, price: 10 }), item({ id: 3, price: 10 })];
    expect(calculateBuyXGetYDiscount(items, promoFree)).toBe(10);
  });

  it('honors the CATEGORY scope', () => {
    const promoCat = { type: 'BUY_X_GET_Y', value: 10, min_quantity: 2, applies_to: 'CATEGORY', target_category: 'COPOS DE AÇAÍ' };
    const items = [
      item({ id: 1 }),
      item({ id: 2 }),
      item({ id: 3 }),
      item({ id: 4, category: 'ADICIONAIS' }),
      item({ id: 5, category: 'ADICIONAIS' }),
    ];
    expect(getQualifyingItems(items, promoCat).length).toBe(3);
    expect(calculateBuyXGetYDiscount(items, promoCat)).toBe(10);
  });

  it('honors the SPECIFIC_PRODUCT scope and is case-insensitive on category', () => {
    const promoProduct = { type: 'BUY_X_GET_Y', value: 10, min_quantity: 1, applies_to: 'SPECIFIC_PRODUCT', target_product_id: 7 };
    expect(calculateBuyXGetYDiscount([item({ id: 7 })], promoProduct)).toBe(0);
    expect(calculateBuyXGetYDiscount([item({ id: 7 }), item({ id: 7 })], promoProduct)).toBe(10);

    const promoCat = { type: 'BUY_X_GET_Y', value: 10, min_quantity: 1, applies_to: 'CATEGORY', target_category: 'copos de açaí' };
    expect(calculateBuyXGetYDiscount([item(), item()], promoCat)).toBe(10);
  });

  it('never exceeds the table total', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => item({ id: n, price: 10 }));
    expect(calculateDiscount(promo, 100, items)).toBeLessThanOrEqual(100);
    expect(calculateDiscount(promo, 20, items)).toBe(20);
  });

  it('returns 0 when no items are available (cannot verify quantities)', () => {
    expect(calculateDiscount(promo, 30)).toBe(0);
  });
});

describe('promotion helpers', () => {
  it('isPromotionEligible gates BUY_X_GET_Y by X + 1 items', () => {
    const promo = { type: 'BUY_X_GET_Y', value: 10, min_quantity: 2, applies_to: 'ALL' };
    expect(isPromotionEligible(promo, [item()])).toBe(false);
    expect(isPromotionEligible(promo, [item(), item()])).toBe(false);
    expect(isPromotionEligible(promo, [item(), item(), item()])).toBe(true);
    expect(isPromotionEligible({ type: 'PERCENTAGE', value: 10 }, [])).toBe(true);
    expect(isPromotionEligible(null, [])).toBe(false);
  });

  it('formatPromotionLabel renders each type', () => {
    expect(formatPromotionLabel({ type: 'PERCENTAGE', value: 15 })).toBe('15%');
    expect(formatPromotionLabel({ type: 'FIXED_AMOUNT', value: 8 })).toBe('R$ 8');
    expect(formatPromotionLabel({ type: 'BUY_X_GET_Y', value: 10, min_quantity: 2 })).toBe('Compre 2 Leve 1');
    expect(formatPromotionLabel(null)).toBe('');
  });

  it('returns 0 for unknown promotion types', () => {
    expect(calculateDiscount({ type: 'MYSTERY', value: 50 }, 100)).toBe(0);
    expect(calculateDiscount(null, 100)).toBe(0);
  });
});
