import { OperationalBudget, OperationalExpense, MONTH_KEYS, CATEGORY_TO_MACROBLOCO, ALL_OPERATIONAL_CATEGORIES } from '@/lib/types';

/** Maps a financial cost_center string to the operational branch label. */
export const COST_CENTER_TO_BRANCH: Record<string, string> = {
  BH: 'BH-Matriz', SP: 'SP', RJ: 'RJ', PAG: 'PAG', VAG: 'VAG', FLO: 'FLO',
  JM: 'JM', ITA: 'ITA', CPN: 'CPN', LIM: 'LIM', JUN: 'JUN', SJC: 'SJC',
};

export function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function fmtBRLk(v: number): string {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return fmtBRL(v);
}

export type ConsumedItem = {
  branch: string;
  macrobloco: string;
  category: string;
  amount: number;
  date: string;
  source: 'card' | 'request' | 'operational';
  description: string;
};

/** Aggregates corporate-card expenses + paid payment_requests + operational expenses
 *  into a unified consumption list filtered by year. */
export function buildConsumedList(args: {
  year: number;
  expenses: Array<{ description: string; amount: number; cost_center: string; category: string; expense_date: string; status: string }>;
  payments: Array<{ description: string; amount: number; cost_center: string; category: string; status: string; payment_date?: string | null; request_date?: string | null; due_date?: string | null }>;
  opExpenses: OperationalExpense[];
}): ConsumedItem[] {
  const { year, expenses, payments, opExpenses } = args;
  const list: ConsumedItem[] = [];

  expenses.forEach(e => {
    const d = new Date(e.expense_date);
    if (d.getFullYear() !== year) return;
    list.push({
      branch: COST_CENTER_TO_BRANCH[e.cost_center] ?? e.cost_center,
      macrobloco: CATEGORY_TO_MACROBLOCO[e.category] ?? '—',
      category: e.category,
      amount: Number(e.amount) || 0,
      date: e.expense_date,
      source: 'card',
      description: e.description,
    });
  });

  payments.forEach(p => {
    if (p.status !== 'pago') return;
    const ref = p.payment_date || p.request_date || p.due_date;
    if (!ref) return;
    const d = new Date(ref);
    if (d.getFullYear() !== year) return;
    list.push({
      branch: COST_CENTER_TO_BRANCH[p.cost_center] ?? p.cost_center,
      macrobloco: CATEGORY_TO_MACROBLOCO[p.category] ?? '—',
      category: p.category,
      amount: Number(p.amount) || 0,
      date: ref,
      source: 'request',
      description: p.description,
    });
  });

  opExpenses.forEach(o => {
    const d = new Date(o.expense_date);
    if (d.getFullYear() !== year) return;
    list.push({
      branch: o.branch,
      macrobloco: o.macrobloco,
      category: o.category,
      amount: Number(o.amount) || 0,
      date: o.expense_date,
      source: 'operational',
      description: o.description,
    });
  });

  return list;
}

export function getMonthIndex(dateStr: string): number {
  return new Date(dateStr).getMonth();
}

/** Returns the monthly amount of a budget row for a given month index 0-11 */
export function budgetMonthAmount(b: OperationalBudget, monthIdx: number): number {
  const key = MONTH_KEYS[monthIdx];
  return Number((b as Record<string, unknown>)[`${key}_amount`] ?? 0);
}

/** True if a category is recognized in the operational catalog. */
export function isKnownCategory(c: string): boolean {
  return ALL_OPERATIONAL_CATEGORIES.includes(c);
}
