import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DbAsset = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  branch: string;
  acquisition_date: string | null;
  image_url: string | null;
  floor: string | null;
  inventoried: boolean;
  condition: string;
};

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('code');
      if (error) throw error;
      return data as DbAsset[];
    },
  });
}

export function useAddAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Omit<DbAsset, 'id'>) => {
      const { data, error } = await supabase.from('assets').insert(a).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Patrimônio cadastrado'); },
    onError: () => toast.error('Erro ao cadastrar patrimônio'),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbAsset> & { id: string }) => {
      const { error } = await supabase.from('assets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast.success('Patrimônio atualizado'); },
    onError: () => toast.error('Erro ao atualizar patrimônio'),
  });
}
