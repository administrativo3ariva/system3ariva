import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OperationalBudget, MONTH_KEYS } from '@/lib/types';

export function useOperationalBudgets(year: number = 2026) {
  return useQuery({
    queryKey: ['operational_budgets', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_budgets')
        .select('*')
        .eq('year', year)
        .order('branch')
        .order('macrobloco')
        .order('category');
      if (error) throw error;
      return (data || []) as OperationalBudget[];
    },
  });
}

type UpsertInput = {
  branch: string;
  macrobloco: string;
  category: string;
  year: number;
  annual_amount: number;
  /** When true, divide annual evenly across 12 months. Defaults to true. */
  splitEvenly?: boolean;
  monthly?: Partial<Record<typeof MONTH_KEYS[number], number>>;
  notes?: string | null;
};

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertInput) => {
      const { splitEvenly = true, monthly = {}, ...rest } = input;
      const monthlyValues: Record<string, number> = {};
      if (splitEvenly) {
        const per = +(rest.annual_amount / 12).toFixed(2);
        MONTH_KEYS.forEach(k => { monthlyValues[`${k}_amount`] = per; });
      } else {
        MONTH_KEYS.forEach(k => { monthlyValues[`${k}_amount`] = monthly[k] ?? 0; });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = { ...rest, ...monthlyValues } as any;

      const { data: existing } = await supabase
        .from('operational_budgets')
        .select('id')
        .eq('branch', rest.branch)
        .eq('macrobloco', rest.macrobloco)
        .eq('category', rest.category)
        .eq('year', rest.year)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('operational_budgets')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('operational_budgets')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_budgets'] });
      toast.success('Orçamento atualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBudgetMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: number }) => {
      const { data, error } = await supabase
        .from('operational_budgets')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ [field]: value } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operational_budgets'] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('operational_budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_budgets'] });
      toast.success('Orçamento removido');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
