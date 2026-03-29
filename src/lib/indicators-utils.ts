import { useMemo } from 'react';
import {
  startOfMonth, endOfMonth, subMonths, startOfYear, format, parseISO, isWithinInterval,
  differenceInCalendarMonths, isSameMonth, isSameYear,
} from 'date-fns';
import type { DbMovement } from '@/hooks/use-movements';
import type { DbProduct } from '@/hooks/use-products';
import type { DbCollaborator } from '@/hooks/use-collaborators';

export type PeriodPreset = 'month' | '3m' | '6m' | 'ytd' | 'custom';

export function getDateRange(preset: PeriodPreset, customFrom?: Date, customTo?: Date): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case 'month': return { from: startOfMonth(now), to: endOfMonth(now) };
    case '3m': return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case '6m': return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
    case 'ytd': return { from: startOfYear(now), to: endOfMonth(now) };
    case 'custom': return { from: customFrom || startOfMonth(now), to: customTo || endOfMonth(now) };
  }
}

export function filterMovements(
  movements: DbMovement[],
  range: { from: Date; to: Date },
  branches: string[],
  categories: string[],
  productMap: Map<string, DbProduct>,
  selectedItem?: string,
) {
  return movements.filter(m => {
    const d = parseISO(m.date);
    if (!isWithinInterval(d, { start: range.from, end: range.to })) return false;
    if (branches.length > 0 && !branches.includes(m.unit)) return false;
    if (selectedItem && m.product_id !== selectedItem) return false;
    if (categories.length > 0) {
      const p = productMap.get(m.product_id);
      if (!p || !categories.includes(p.category)) return false;
    }
    return true;
  });
}

export function getPreviousPeriodRange(range: { from: Date; to: Date }): { from: Date; to: Date } {
  const months = differenceInCalendarMonths(range.to, range.from) + 1;
  return {
    from: subMonths(range.from, months),
    to: subMonths(range.to, months),
  };
}

export function getSameRangeLastYear(range: { from: Date; to: Date }): { from: Date; to: Date } {
  return {
    from: subMonths(range.from, 12),
    to: subMonths(range.to, 12),
  };
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function sumEntradas(movements: DbMovement[]) {
  return movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
}

export function sumSaidas(movements: DbMovement[]) {
  return movements.filter(m => m.type === 'saida').reduce((s, m) => s + m.quantity, 0);
}

export function totalGasto(movements: DbMovement[], productMap: Map<string, DbProduct>) {
  return movements
    .filter(m => m.type === 'entrada')
    .reduce((s, m) => {
      const p = productMap.get(m.product_id);
      return s + m.quantity * (p?.unit_price ?? 0);
    }, 0);
}

export function monthlyBreakdown(movements: DbMovement[], productMap: Map<string, DbProduct>) {
  const map = new Map<string, { gasto: number; consumo: number }>();
  movements.forEach(m => {
    const key = format(parseISO(m.date), 'yyyy-MM');
    const entry = map.get(key) || { gasto: 0, consumo: 0 };
    const p = productMap.get(m.product_id);
    if (m.type === 'entrada') entry.gasto += m.quantity * (p?.unit_price ?? 0);
    if (m.type === 'saida') entry.consumo += m.quantity;
    map.set(key, entry);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({ month, ...vals }));
}

export function formatBRL(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(v: number | null) {
  if (v === null) return 'Sem base';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}
