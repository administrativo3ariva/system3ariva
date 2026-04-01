import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

export type DbNfItem = {
  id: string;
  nf_upload_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  unit_of_measure?: string;
};

export type DbNfUpload = {
  id: string;
  file_name: string;
  file_url?: string | null;
  upload_date: string;
  status: string;
  supplier: string | null;
  total_value: number | null;
  unit: string;
  freight_value?: number | null;
  other_expenses?: number | null;
  discount_value?: number | null;
  nf_items?: DbNfItem[];
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Falha ao ler o arquivo selecionado.'));
        return;
      }
      const [, base64 = ''] = reader.result.split(',');
      resolve(base64);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Falha ao ler o arquivo selecionado.'));
    };
    reader.readAsDataURL(file);
  });
}

export function useNfUploads() {
  const { selectedBranch } = useApp();
  return useQuery({
    queryKey: ['nf_uploads', selectedBranch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nf_uploads')
        .select('*, nf_items(*)')
        .eq('unit', selectedBranch)
        .order('upload_date', { ascending: false });
      if (error) throw error;
      return data as DbNfUpload[];
    },
  });
}

export function useUploadAndProcessNf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, unit }: { file: File; unit: string }) => {
      const fileDataBase64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('process-nf', {
        body: {
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileDataBase64,
          unit,
        },
      });
      if (error) {
        let message = error.message || 'Erro ao enviar NF';
        if (error.context instanceof Response) {
          try {
            const payload = await error.context.json();
            message = payload?.error || message;
          } catch { /* ignore */ }
        }
        throw new Error(message);
      }
      return data as { status?: string; error?: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
      if (data?.error) {
        toast.warning(data.error || 'NF enviada para conferência, mas houve falha na extração automática.');
        return;
      }
      toast.success('NF enviada e processada!');
    },
    onError: (err: any) => {
      console.error('Upload NF error:', err?.message || err);
      toast.error(err?.message || 'Erro ao enviar NF');
    },
  });
}

export function useUpdateNfUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; supplier?: string; total_value?: number; freight_value?: number; other_expenses?: number; discount_value?: number }) => {
      const { error } = await supabase.from('nf_uploads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
    },
    onError: () => toast.error('Erro ao atualizar NF'),
  });
}

export function useApproveNf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nf: DbNfUpload) => {
      const { error: updateError } = await supabase
        .from('nf_uploads')
        .update({ status: 'aprovado' })
        .eq('id', nf.id);
      if (updateError) throw updateError;

      const targetUnit = nf.unit || 'BH-Matriz';
      const items = nf.nf_items || [];
      for (const item of items) {
        const { data: existing } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', item.name)
          .eq('unit', targetUnit)
          .limit(1);

        let productId: string;
        let productName: string;

        if (existing && existing.length > 0) {
          productId = existing[0].id;
          productName = existing[0].name;
        } else {
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              name: item.name,
              category: item.category || 'Outros',
              quantity: 0,
              unit_price: item.unit_price,
              total_price: 0,
              unit: targetUnit,
              unit_of_measure: item.unit_of_measure || 'UN',
            })
            .select()
            .single();
          if (productError || !newProduct) throw productError || new Error('Erro ao criar produto');
          productId = newProduct.id;
          productName = newProduct.name;
        }

        const { error: moveError } = await supabase.from('stock_movements').insert({
          product_id: productId,
          product_name: productName,
          type: 'entrada',
          quantity: item.quantity,
          unit: targetUnit,
          responsible: 'Sistema',
          notes: `NF: ${nf.file_name} — ${nf.supplier || 'Fornecedor não identificado'}`,
          unit_of_measure: item.unit_of_measure || 'UN',
        });
        if (moveError) throw moveError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      toast.success('NF aprovada e itens adicionados ao estoque!');
    },
    onError: (err: any) => {
      console.error('Approve NF error:', err);
      toast.error(err?.message || 'Erro ao aprovar NF');
    },
  });
}

export function useDeleteNfUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('nf_items').delete().eq('nf_upload_id', id);
      const { error } = await supabase.from('nf_uploads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
      toast.success('NF removida');
    },
    onError: () => toast.error('Erro ao remover NF'),
  });
}
