import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

export type DbProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
  min_stock: number | null;
  unit_of_measure: string;
};

export function useProducts() {
  const { selectedBranch } = useApp();
  return useQuery({
    queryKey: ['products', selectedBranch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('unit', selectedBranch)
        .order('name');
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<DbProduct, 'id'>) => {
      const { data, error } = await supabase.from('products').insert(p).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produto cadastrado'); },
    onError: () => toast.error('Erro ao cadastrar produto'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProduct> & { id: string }) => {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    onError: () => toast.error('Erro ao atualizar produto'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error: movError } = await supabase.from('stock_movements').delete().eq('product_id', id);
      if (movError) throw movError;
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Produto excluído');
    },
    onError: () => toast.error('Erro ao excluir produto'),
  });
}
