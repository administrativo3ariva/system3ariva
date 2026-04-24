/**
 * Utilities for invoice allocation (rateio).
 *
 * Storage model: `allocations` JSONB stores ONLY the secondary slices.
 * The primary category implicitly receives the remainder
 *   = total - sum(allocations).
 */

export type Allocation = { category: string; amount: number };

export type AllocationSlice = {
  category: string;
  amount: number;
  isPrimary: boolean;
};

export interface AllocatableEntry {
  amount: number | string;
  category: string;
  allocations?: Allocation[] | null | unknown;
}

/** Safely coerce the JSONB allocations field into a typed array. */
export function readAllocations(value: unknown): Allocation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((a: any) => ({
      category: String(a?.category ?? ''),
      amount: Number(a?.amount) || 0,
    }))
    .filter((a) => a.category && a.amount > 0);
}

/** Returns true if the entry is split between 2+ categories. */
export function isAllocated(entry: AllocatableEntry): boolean {
  const slices = readAllocations(entry.allocations);
  if (slices.length === 0) return false;
  // Considered rateado only if it actually adds at least one secondary
  return slices.some((s) => s.amount > 0.01);
}

/**
 * Expand an entry into per-category slices.
 * If not allocated, returns a single slice = entry.amount on entry.category.
 */
export function expandAllocations(entry: AllocatableEntry): AllocationSlice[] {
  const total = Number(entry.amount) || 0;
  const secondaries = readAllocations(entry.allocations);
  if (secondaries.length === 0) {
    return [{ category: entry.category, amount: total, isPrimary: true }];
  }
  const sumSecondary = secondaries.reduce((s, a) => s + a.amount, 0);
  const primaryAmount = +(total - sumSecondary).toFixed(2);
  const slices: AllocationSlice[] = [];
  if (primaryAmount > 0.001) {
    slices.push({ category: entry.category, amount: primaryAmount, isPrimary: true });
  }
  secondaries.forEach((s) =>
    slices.push({ category: s.category, amount: s.amount, isPrimary: false })
  );
  return slices;
}

/**
 * Determine which category should be marked as "primary" (the one with the
 * highest amount). Returns the chosen primary plus the new secondary list.
 *
 * Used at form submit so the entry's `category` field reflects the dominant
 * category, while `allocations` stores the remaining slices.
 */
export function normalizePrimary(
  currentPrimary: string,
  total: number,
  secondaries: Allocation[]
): { primary: string; secondaries: Allocation[] } {
  const sumSecondary = secondaries.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const primaryAmount = +(total - sumSecondary).toFixed(2);

  const allSlices: Allocation[] = [
    { category: currentPrimary, amount: primaryAmount },
    ...secondaries.map((s) => ({ category: s.category, amount: Number(s.amount) || 0 })),
  ].filter((s) => s.category && s.amount > 0.001);

  if (allSlices.length === 0) {
    return { primary: currentPrimary, secondaries };
  }

  // Pick the slice with the largest amount as the new primary.
  const winner = allSlices.reduce((max, s) => (s.amount > max.amount ? s : max), allSlices[0]);

  // Everything else becomes a secondary, with amount > 0.
  const newSecondaries = allSlices
    .filter((s) => s !== winner)
    .map((s) => ({ category: s.category, amount: +s.amount.toFixed(2) }));

  return { primary: winner.category, secondaries: newSecondaries };
}

/** Format currency BRL — local helper to avoid extra imports. */
export function fmtBRLAlloc(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
