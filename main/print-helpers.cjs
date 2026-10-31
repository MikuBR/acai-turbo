/**
 * print-helpers.cjs
 *
 * Pure helpers for thermal receipt printing. Extracted from main.cjs so the
 * classification / formatting logic can be unit-tested without a printer or
 * Electron. The actual printing (node-thermal-printer) stays in main.cjs.
 */

const RECEIPT_WIDTH = 40;

function safeUpper(s) {
  return (s == null ? '' : String(s)).toUpperCase();
}

function classifyItems(items) {
  const kitchenItems = [];
  const frontItems = [];
  for (const i of (items || [])) {
    const cat = safeUpper(i && i.category);
    const isDrink = cat.includes('BEBIDA') || cat.includes('REFRIGERANTE') || cat.includes('CHOPP');
    if (isDrink) frontItems.push(i);
    else kitchenItems.push(i);
  }
  return { kitchenItems, frontItems };
}

function receiptLine(char = '=', text = '') {
  const line = String(char).repeat(RECEIPT_WIDTH);
  if (!text) return line;
  const pad = Math.floor((RECEIPT_WIDTH - text.length) / 2);
  return line.slice(0, pad) + text + line.slice(0, RECEIPT_WIDTH - text.length - pad);
}

function receiptDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return '';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} - ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function stripEscPos(text) {
  return (text || '').replace(/[\x00-\x1F\x7F]/g, '');
}

function buildKitchenText(orderData, items) {
  const lines = [];
  const od = orderData || {};
  lines.push('AÇAÍ');
  lines.push(receiptLine('='));
  if (od.isDelivery) {
    lines.push('** DELIVERY **');
    lines.push(`Cliente: ${safeUpper(od.tableName)}`);
    if (od.phone) lines.push(`Tel: ${od.phone}`);
    if (od.address) lines.push(`End: ${od.address}`);
  } else {
    lines.push(od.tableName || '');
  }
  const operator = od.operatorName || '';
  lines.push(`Operador: ${operator}`);
  lines.push(`Data: ${receiptDate(od.createdAt)}`);
  lines.push(receiptLine('-'));
  items.forEach((item, idx) => {
    const title = `${item.quantity || 1} ${(item.name || '').toUpperCase()} (${item.size || ''})`.trim();
    lines.push(title);
    if (item.notes) {
      item.notes.split('|').map(n => n.trim()).filter(Boolean).forEach(note => {
        lines.push(`  * ${note}`);
      });
    }
    if (idx < items.length - 1) lines.push(receiptLine('-'));
  });
  lines.push(receiptLine('='));
  return lines.join('\n');
}

function buildFrontText(orderData, items) {
  return buildKitchenText(orderData, items); // same layout
}

module.exports = {
  RECEIPT_WIDTH,
  safeUpper,
  classifyItems,
  receiptLine,
  receiptDate,
  stripEscPos,
  buildKitchenText,
  buildFrontText,
};
