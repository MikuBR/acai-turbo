// Utilitários de formatação de datas no padrão brasileiro (dd/mm/aa)

function toDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

/** Formata como 'dd/mm/aa' (ex: 15/01/26). Retorna '' para data inválida. */
export function formatBR(date: Date | string): string {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Formata como 'dd/mm/aa HH:mm'. Retorna '' para data inválida. */
export function formatBRDateTime(date: Date | string): string {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatBR(d)} ${hh}:${min}`;
}

/** Converte 'dd/mm/aa' de volta para Date (ano 20xx, meia-noite local). Retorna null se inválido. */
export function parseBR(str: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = 2000 + Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}
