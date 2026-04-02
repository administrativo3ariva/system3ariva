import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

export type DbMovement = {
  id: string;
  product_id: string;
  product_name: string;
  type: string;
  quantity: number;
  date: string;
  user: string;
  responsible: string | null;
  notes: string | null;
  unit: string;
  floor: string | null;
  unit_of_measure: string;
  created_at: string;
};

export function useMovements() {
  const { selectedBranch } = useApp();
  return useQuery({
    queryKey: ['movements', selectedBranch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('unit', selectedBranch)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as DbMovement[];
    },
  });
}

export function useAddMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Omit<DbMovement, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('stock_movements').insert(m).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Movimentação registrada');
    },
    onError: () => toast.error('Erro ao registrar movimentação'),
  });
}

export function useUpdateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbMovement> & { id: string }) => {
      const { error } = await supabase.from('stock_movements').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Movimentação atualizada');
    },
    onError: () => toast.error('Erro ao atualizar movimentação'),
  });
}

export function useDeleteMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stock_movements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Movimentação removida');
    },
    onError: () => toast.error('Erro ao remover movimentação'),
  });
}
