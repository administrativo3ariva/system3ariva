import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DbNfItem = {
  id: string;
  nf_upload_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type DbNfUpload = {
  id: string;
  file_name: string;
  upload_date: string;
  status: string;
  supplier: string | null;
  total_value: number | null;
  nf_items?: DbNfItem[];
};

export function useNfUploads() {
  return useQuery({
    queryKey: ['nf_uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nf_uploads')
        .select('*, nf_items(*)')
        .order('upload_date', { ascending: false });
      if (error) throw error;
      return data as DbNfUpload[];
    },
  });
}

export function useAddNfUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ...nf }: Omit<DbNfUpload, 'id'> & { items: Omit<DbNfItem, 'id' | 'nf_upload_id'>[] }) => {
      const { data, error } = await supabase.from('nf_uploads').insert(nf).select().single();
      if (error) throw error;
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('nf_items').insert(
          items.map(i => ({ ...i, nf_upload_id: data.id }))
        );
        if (itemsError) throw itemsError;
      }
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nf_uploads'] }); toast.success('NF enviada'); },
    onError: () => toast.error('Erro ao enviar NF'),
  });
}

export function useUpdateNfUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string }) => {
      const { error } = await supabase.from('nf_uploads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nf_uploads'] }); },
    onError: () => toast.error('Erro ao atualizar NF'),
  });
}
