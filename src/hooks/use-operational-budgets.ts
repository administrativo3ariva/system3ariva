import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OperationalBudgetMonthly, OperationalMacrobloco } from '@/lib/types';

/** Fetch all monthly budgets for a year (across all branches/categories). */
export function useOperationalBudgets(year: number = 2026) {
  return useQuery({
    queryKey: ['operational_budgets_monthly', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_budgets_monthly')
        .select('*')
        .eq('year', year)
        .order('branch')
        .order('macrobloco')
        .order('category')
        .order('month');
      if (error) throw error;
      return (data || []) as unknown as OperationalBudgetMonthly[];
    },
  });
}

type UpsertInput = {
  year: number;
  month: number;
  branch: string;
  macrobloco: OperationalMacrobloco;
  category: string;
  amount: number;
  notes?: string | null;
};

/** Upsert a single (year, month, branch, macrobloco, category) row. */
export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      const { data: existing } = await supabase
        .from('operational_budgets_monthly')
        .select('id')
        .eq('year', input.year)
        .eq('month', input.month)
        .eq('branch', input.branch)
        .eq('macrobloco', input.macrobloco)
        .eq('category', input.category)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('operational_budgets_monthly')
          .update({ amount: input.amount, notes: input.notes ?? null })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('operational_budgets_monthly')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operational_budgets_monthly'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Bulk upsert many monthly rows. Used to save a whole branch/month grid at once. */
export function useBulkUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: UpsertInput[]) => {
      if (rows.length === 0) return [];
      // upsert in batches via onConflict
      const { data, error } = await supabase
        .from('operational_budgets_monthly')
        .upsert(rows, { onConflict: 'year,month,branch,macrobloco,category' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_budgets_monthly'] });
      toast.success('Orçamento salvo');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Duplicate all budget rows of (year, sourceMonth, branch) into targetMonth. */
export function useDuplicateMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, branch, sourceMonth, targetMonth }: { year: number; branch: string; sourceMonth: number; targetMonth: number }) => {
      const { data: source, error } = await supabase
        .from('operational_budgets_monthly')
        .select('*')
        .eq('year', year)
        .eq('branch', branch)
        .eq('month', sourceMonth);
      if (error) throw error;
      const rows = (source || []).map(r => ({
        year, month: targetMonth, branch: r.branch,
        macrobloco: r.macrobloco, category: r.category, amount: r.amount,
      }));
      if (rows.length === 0) return [];
      const { error: upErr } = await supabase
        .from('operational_budgets_monthly')
        .upsert(rows, { onConflict: 'year,month,branch,macrobloco,category' });
      if (upErr) throw upErr;
      return rows;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_budgets_monthly'] });
      toast.success('Orçamento duplicado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('operational_budgets_monthly').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operational_budgets_monthly'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
