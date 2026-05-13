import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CompanyAllocation = { company: string; amount: number };

export interface RecurringExpense {
  id: string;
  branch: string;
  macrobloco: string;
  category: string;
  description: string;
  supplier?: string | null;
  supplier_id?: string | null;
  amount: number;
  due_day: number;
  company: string;
  cost_center: string;
  payment_method?: string | null;
  active: boolean;
  notes?: string | null;
  company_allocations?: CompanyAllocation[] | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpenseRun {
  id: string;
  recurring_expense_id: string;
  year: number;
  month: number;
  payment_request_id?: string | null;
  generated_at: string;
  paid: boolean;
  paid_date?: string | null;
  due_date?: string | null;
  amount: number;
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ['recurring_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses' as any)
        .select('*')
        .order('branch', { ascending: true })
        .order('category', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as RecurringExpense[];
    },
  });
}

export function useRecurringExpenseRuns() {
  return useQuery({
    queryKey: ['recurring_expense_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expense_runs' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as RecurringExpenseRun[];
    },
  });
}

export function useUpsertRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<RecurringExpense> & { id?: string }) => {
      if (row.id) {
        const { id, created_at, updated_at, ...updates } = row as any;
        const { data, error } = await supabase
          .from('recurring_expenses' as any)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('recurring_expenses' as any)
          .insert(row as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_expenses'] });
      toast.success('Recorrência salva');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_expenses' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_expenses'] });
      toast.success('Recorrência excluída');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/**
 * Generates run rows for the given (year, month) for all active templates that haven't been run yet.
 * NOTE: As of the new flow, runs are SELF-CONTAINED — no payment_requests are created. The runs
 * track their own paid status, due_date and amount, and live exclusively inside the Recurring tab.
 */
export function useGenerateRecurringMonth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const [{ data: templates, error: e1 }, { data: existing, error: e2 }] = await Promise.all([
        supabase.from('recurring_expenses' as any).select('*').eq('active', true),
        supabase.from('recurring_expense_runs' as any).select('*').eq('year', year).eq('month', month),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const ranSet = new Set((existing || []).map((r: any) => r.recurring_expense_id));
      const toGenerate = (templates || []).filter((t: any) => !ranSet.has(t.id));

      let created = 0;
      for (const t of toGenerate as any[]) {
        const lastDay = new Date(year, month, 0).getDate();
        const day = Math.min(t.due_day || 5, lastDay);
        const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const { error: runErr } = await supabase
          .from('recurring_expense_runs' as any)
          .insert({
            recurring_expense_id: t.id,
            year,
            month,
            due_date: dueDate,
            amount: t.amount,
            paid: false,
          } as any);
        if (runErr) throw runErr;
        created++;
      }
      return { created, skipped: (templates?.length || 0) - toGenerate.length };
    },
    onSuccess: ({ created, skipped }) => {
      qc.invalidateQueries({ queryKey: ['recurring_expense_runs'] });
      toast.success(`${created} lançamento(s) gerado(s). ${skipped} já existiam.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Toggle paid status of a single run (sets/clears paid_date). */
export function useToggleRunPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid, paidDate }: { id: string; paid: boolean; paidDate?: string }) => {
      const { error } = await supabase
        .from('recurring_expense_runs' as any)
        .update({
          paid,
          paid_date: paid ? (paidDate || new Date().toISOString().slice(0, 10)) : null,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_expense_runs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Delete a single generated run (revert generation for that month). */
export function useDeleteRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_expense_runs' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring_expense_runs'] });
      toast.success('Lançamento removido');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
