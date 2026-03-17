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
  file_url?: string | null;
  upload_date: string;
  status: string;
  supplier: string | null;
  total_value: number | null;
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

export function useUploadAndProcessNf() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileDataBase64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('process-nf', {
        body: {
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileDataBase64,
        },
      });

      if (error) {
        let message = error.message || 'Erro ao enviar NF';

        if (error.context instanceof Response) {
          try {
            const payload = await error.context.json();
            message = payload?.error || message;
          } catch {
            // ignore response parsing errors
          }
        }

        throw new Error(message);
      }

      return data as { status?: string; error?: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });

      if (data?.status === 'erro_ocr') {
        toast.warning(data.error || 'NF enviada, mas houve erro na extração automática.');
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
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; supplier?: string; total_value?: number }) => {
      const { error } = await supabase.from('nf_uploads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
    },
    onError: () => toast.error('Erro ao atualizar NF'),
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
