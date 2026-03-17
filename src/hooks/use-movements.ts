import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
};

export function useMovements() {
  return useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_movements').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data as DbMovement[];
    },
  });
}

export function useAddMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Omit<DbMovement, 'id'>) => {
      const { data, error } = await supabase.from('stock_movements').insert(m).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['products'] }); // trigger updates product qty
      toast.success('Movimentação registrada');
    },
    onError: () => toast.error('Erro ao registrar movimentação'),
  });
}
