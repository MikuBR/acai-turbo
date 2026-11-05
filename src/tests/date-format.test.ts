// ============================================================
// date-format.test.ts — Testes do utilitário src/utils/date.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { formatBR, formatBRDateTime, parseBR } from '../utils/date';

describe('formatBR', () => {
  it('formata Date como dd/mm/aa', () => {
    expect(formatBR(new Date(2026, 0, 15))).toBe('15/01/26');
    expect(formatBR(new Date(2026, 11, 31))).toBe('31/12/26');
    expect(formatBR(new Date(2026, 0, 5))).toBe('05/01/26');
  });

  it('aceita string de data/hora local (sem Z)', () => {
    expect(formatBR('2026-01-15T09:05:00')).toBe('15/01/26');
  });

  it('retorna string vazia para data inválida', () => {
    expect(formatBR('não é data')).toBe('');
    expect(formatBR(new Date(NaN))).toBe('');
  });
});

describe('formatBRDateTime', () => {
  it('formata como dd/mm/aa HH:mm com zero à esquerda', () => {
    expect(formatBRDateTime(new Date(2026, 0, 15, 9, 5))).toBe('15/01/26 09:05');
    expect(formatBRDateTime('2026-12-31T23:59:00')).toBe('31/12/26 23:59');
  });

  it('retorna string vazia para data inválida', () => {
    expect(formatBRDateTime('lixo')).toBe('');
  });
});

describe('parseBR', () => {
  it('converte dd/mm/aa para Date local à meia-noite', () => {
    const d = parseBR('15/01/26');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(0);
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(0);
    expect(d!.getMinutes()).toBe(0);
  });

  it('faz round-trip com formatBR', () => {
    expect(formatBR(parseBR('31/12/26')!)).toBe('31/12/26');
  });

  it('rejeita formatos inválidos', () => {
    expect(parseBR('')).toBeNull();
    expect(parseBR('15-01-26')).toBeNull();
    expect(parseBR('1/1/26')).toBeNull();
    expect(parseBR('abc')).toBeNull();
  });

  it('rejeita datas inexistentes', () => {
    expect(parseBR('31/02/26')).toBeNull();
    expect(parseBR('00/01/26')).toBeNull();
    expect(parseBR('15/13/26')).toBeNull();
  });
});
