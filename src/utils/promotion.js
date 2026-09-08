/**
 * promotion.js — Cálculo de desconto de promoções (renderer).
 *
 * Convenções do schema `promotions`:
 *   - type PERCENTAGE:   `value` = percentual (0-100) aplicado ao total da mesa.
 *   - type FIXED_AMOUNT: `value` = valor fixo (R$) abatido do total da mesa.
 *   - type BUY_X_GET_Y:  `min_quantity` (X) = qtd. mínima de itens elegíveis para
 *                        ativar. A cada grupo de X itens, o próximo item elegível
 *                        é 100% grátis (Y = 1). `value` guarda o desconto em R$
 *                        do item grátis; quando `value` é 0 ou cobre o preço do
 *                        item, ele sai grátis.
 *
 * `applies_to`: ALL | CATEGORY (target_category) | SPECIFIC_PRODUCT (target_product_id).
 */

const toNumber = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

const roundCents = (v) => Math.round(v * 100) / 100;

const normalizeCategory = (c) => (c || '').toUpperCase().trim();

export function matchesPromotionScope(item, promo) {
  if (!item || !promo) return false;
  switch (promo.applies_to) {
    case 'CATEGORY':
      return normalizeCategory(item.category) === normalizeCategory(promo.target_category);
    case 'SPECIFIC_PRODUCT':
      return Number(item.id) === Number(promo.target_product_id);
    case 'ALL':
    default:
      return true;
  }
}

/** Itens que atendem o escopo da promoção (applies_to / target_*). */
export function getQualifyingItems(items, promo) {
  const list = Array.isArray(items) ? items : [];
  return list.filter(item => matchesPromotionScope(item, promo));
}

/**
 * BUY_X_GET_Y: a cada grupo de X itens elegíveis pagantes, o item seguinte é
 * grátis (ou recebe o desconto de `value`, o que for menor).
 *
 * É o padrão de prateleira "compre X leve Y": o item grátis só existe quando há
 * pelo menos X + 1 itens. O intervalo se repete a cada X + 1 itens.
 *
 * Ex.: X = 2 → 3 itens = 1 grátis; 5 itens = 1 grátis; 6 itens = 2 grátis.
 * Ex.: X = 1 → de cada 2 itens, o 2º é grátis.
 */
export function calculateBuyXGetYDiscount(items, promo) {
  const x = Math.max(1, Math.floor(toNumber(promo.min_quantity)) || 1);
  const value = Math.max(0, toNumber(promo.value));
  const qualifying = getQualifyingItems(items, promo);
  // Sem um grupo completo de X + o item grátis, nada é descontado.
  if (qualifying.length < x + 1) return 0;

  let discount = 0;
  for (let i = 0; i < qualifying.length; i += 1) {
    // Item grátis de cada grupo: o (X+1)-ésimo, depois o (2X+2)-ésimo, etc.
    if ((i + 1) % (x + 1) !== 0) continue;
    const price = Math.max(0, toNumber(qualifying[i].price));
    // `value` = 0 ⇒ item grátis; caso contrário, desconto limitado ao preço do item.
    discount += value > 0 ? Math.min(value, price) : price;
  }

  return roundCents(discount);
}

/**
 * Aplica a promoção à mesa. `items` são necessários para BUY_X_GET_Y; sem eles a
 * promoção retorna 0 (não há como conferir a quantidade comprada).
 *
 * @param {{ type?: string }} promo
 * @param {number} total Valor bruto da mesa (antes do desconto).
 * @param {Array<{ id?: number, category?: string, price?: number }>} [items]
 * @returns {number} Desconto em R$, limitado ao total da mesa.
 */
export function calculateDiscount(promo, total, items = []) {
  if (!promo) return 0;
  const safeTotal = Math.max(0, toNumber(total));

  if (promo.type === 'PERCENTAGE') {
    return roundCents(safeTotal * (toNumber(promo.value) || 0) / 100);
  }
  if (promo.type === 'FIXED_AMOUNT') {
    return Math.min(Math.max(0, toNumber(promo.value)), safeTotal);
  }
  if (promo.type === 'BUY_X_GET_Y') {
    return Math.min(calculateBuyXGetYDiscount(items, promo), safeTotal);
  }
  return 0;
}

/** A mesa tem itens suficientes para ativar a promoção? */
export function isPromotionEligible(promo, items = []) {
  if (!promo) return false;
  if (promo.type === 'BUY_X_GET_Y') {
    const x = Math.max(1, Math.floor(toNumber(promo.min_quantity)) || 1);
    return getQualifyingItems(items, promo).length >= x + 1;
  }
  return true;
}

/** Rótulo curto para selects/listas de promoção. */
export function formatPromotionLabel(promo) {
  if (!promo) return '';
  if (promo.type === 'PERCENTAGE') return `${promo.value}%`;
  if (promo.type === 'BUY_X_GET_Y') {
    const x = Math.max(1, Math.floor(toNumber(promo.min_quantity)) || 1);
    return `Compre ${x} Leve 1`;
  }
  return `R$ ${promo.value}`;
}
