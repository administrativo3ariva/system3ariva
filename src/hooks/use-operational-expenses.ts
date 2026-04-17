import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OperationalExpense } from '@/lib/types';

export function useOperationalExpenses() {
  return useQuery({
    queryKey: ['operational_expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return (data || []) as OperationalExpense[];
    },
  });
}

export function useCreateOperationalExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<OperationalExpense, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('operational_expenses').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Despesa operacional registrada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateOperationalExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OperationalExpense> & { id: string }) => {
      const { data, error } = await supabase.from('operational_expenses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Despesa atualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteOperationalExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('operational_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Despesa removida');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
