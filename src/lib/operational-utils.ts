import { OperationalBudgetMonthly, CATEGORY_TO_MACROBLOCO, ALL_OPERATIONAL_CATEGORIES, OperationalMacrobloco } from '@/lib/types';
import { expandAllocations, type Allocation } from '@/lib/allocation-utils';

/** Maps a financial cost_center string to the operational branch label.
 *  Note: FLO (cost_center) maps to FLN (branch label per spec). */
export const COST_CENTER_TO_BRANCH: Record<string, string> = {
  BH: 'BH-Matriz', SP: 'SP', RJ: 'RJ', PAG: 'PAG', VAG: 'VAG', FLO: 'FLN',
  ITA: 'ITA', CPN: 'CPN', LIM: 'LIM', JUN: 'JUN', SJC: 'SJC',
};

export function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

export function fmtBRLk(v: number): string {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return fmtBRL(v);
}

export type LaunchStatus = 'realizado' | 'comprometido' | 'cancelado';

export type ConsumedItem = {
  id: string;
  branch: string;
  macrobloco: string;
  category: string;
  amount: number;
  date: string;
  source: 'card' | 'request';
  status: LaunchStatus; // bucket for budget calc
  rawStatus: string; // original status from source
  description: string;
  supplier?: string | null;
  company?: string | null;
  cost_center?: string | null;
  payment_method?: string | null;
  /** True when this item is a slice of an allocated (rateado) entry. */
  isAllocationSlice?: boolean;
  /** Total amount of the parent entry (only set for allocation slices). */
  parentAmount?: number;
};

/** Map a card expense status to a launch bucket.
 *  Card transactions are ALWAYS "realizado" once posted — the gasto already happened.
 *  Only rejeitado/cancelado is excluded. The pendente/aprovado/pago is just an internal
 *  reconciliation/approval flow and must NOT block budget consumption. */
function mapExpenseStatus(s: string): LaunchStatus {
  if (s === 'rejeitado' || s === 'cancelado') return 'cancelado';
  return 'realizado';
}

/** Map a payment_request status to a launch bucket. */
function mapRequestStatus(s: string): LaunchStatus {
  if (s === 'pago') return 'realizado';
  if (s === 'rejeitado' || s === 'cancelado') return 'cancelado';
  return 'comprometido'; // pendente, aprovado, etc.
}

/** Aggregates corporate-card expenses + payment_requests
 *  into a unified consumption list filtered by year + optional month.
 *  Entries with `allocations` are exploded into one slice per category, so
 *  rateios are reflected accurately in dashboards and budget consumption. */
export function buildConsumedList(args: {
  year: number;
  month?: number; // 1-12 optional
  expenses: Array<{ id: string; description: string; amount: number; cost_center: string; category: string; expense_date: string; status: string; supplier?: string | null; company?: string; card_name?: string | null; allocations?: Allocation[] | null | unknown }>;
  payments: Array<{ id: string; description: string; amount: number; cost_center: string; category: string; status: string; payment_date?: string | null; request_date?: string | null; due_date?: string | null; supplier?: string | null; company?: string; payment_method?: string | null; allocations?: Allocation[] | null | unknown }>;
}): ConsumedItem[] {
  const { year, month, expenses, payments } = args;
  const list: ConsumedItem[] = [];

  expenses.forEach(e => {
    const d = new Date(e.expense_date);
    if (d.getFullYear() !== year) return;
    if (month && d.getMonth() + 1 !== month) return;

    const slices = expandAllocations({ amount: Number(e.amount) || 0, category: e.category, allocations: e.allocations });
    const isSplit = slices.length > 1;
    slices.forEach((sl, idx) => {
      list.push({
        id: isSplit ? `${e.id}::${idx}` : e.id,
        branch: COST_CENTER_TO_BRANCH[e.cost_center] ?? e.cost_center,
        macrobloco: CATEGORY_TO_MACROBLOCO[sl.category] ?? '—',
        category: sl.category,
        amount: sl.amount,
        date: e.expense_date,
        source: 'card',
        status: mapExpenseStatus(e.status),
        rawStatus: e.status,
        description: e.description,
        supplier: e.supplier ?? null,
        company: e.company ?? null,
        cost_center: e.cost_center,
        payment_method: e.card_name ?? 'Cartão Corporativo',
        isAllocationSlice: isSplit,
        parentAmount: isSplit ? Number(e.amount) || 0 : undefined,
      });
    });
  });

  payments.forEach(p => {
    const ref = p.payment_date || p.request_date || p.due_date;
    if (!ref) return;
    const d = new Date(ref);
    if (d.getFullYear() !== year) return;
    if (month && d.getMonth() + 1 !== month) return;

    const slices = expandAllocations({ amount: Number(p.amount) || 0, category: p.category, allocations: p.allocations });
    const isSplit = slices.length > 1;
    slices.forEach((sl, idx) => {
      list.push({
        id: isSplit ? `${p.id}::${idx}` : p.id,
        branch: COST_CENTER_TO_BRANCH[p.cost_center] ?? p.cost_center,
        macrobloco: CATEGORY_TO_MACROBLOCO[sl.category] ?? '—',
        category: sl.category,
        amount: sl.amount,
        date: ref,
        source: 'request',
        status: mapRequestStatus(p.status),
        rawStatus: p.status,
        description: p.description,
        supplier: p.supplier ?? null,
        company: p.company ?? null,
        cost_center: p.cost_center,
        payment_method: p.payment_method ?? null,
        isAllocationSlice: isSplit,
        parentAmount: isSplit ? Number(p.amount) || 0 : undefined,
      });
    });
  });

  return list;
}

export function getMonthIndex(dateStr: string): number {
  return new Date(dateStr).getMonth();
}

/** Sum monthly budget rows matching a filter. */
export function sumBudget(rows: OperationalBudgetMonthly[], filter?: Partial<{ branch: string; macrobloco: string; category: string; month: number }>): number {
  return rows.filter(r =>
    (!filter?.branch || r.branch === filter.branch) &&
    (!filter?.macrobloco || r.macrobloco === filter.macrobloco) &&
    (!filter?.category || r.category === filter.category) &&
    (!filter?.month || r.month === filter.month)
  ).reduce((s, r) => s + Number(r.amount), 0);
}

/** True if a category is recognized in the operational catalog. */
export function isKnownCategory(c: string): boolean {
  return ALL_OPERATIONAL_CATEGORIES.includes(c);
}

/** Macroblocks that compose "Despesas Operacionais" subtela */
export const OPERATIONAL_EXPENSES_MACROBLOCOS: OperationalMacrobloco[] = [
  'Serviços e Apoio Operacional',
  'Ocupação e Infraestrutura',
];

/** Macroblock considered as "comprometido fixo" (Ocupação e Infraestrutura) */
export const COMMITTED_MACROBLOCO: OperationalMacrobloco = 'Ocupação e Infraestrutura';
