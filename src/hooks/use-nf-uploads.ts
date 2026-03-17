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
      // 1. Upload file to storage
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${sanitized}`;
      const { error: uploadError } = await supabase.storage
        .from('nf-files')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('nf-files')
        .getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      // 3. Create nf_uploads record as 'processando'
      const { data: nfRecord, error: insertError } = await supabase
        .from('nf_uploads')
        .insert({
          file_name: file.name,
          file_url: fileUrl,
          status: 'processando',
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // 4. Call edge function for OCR
      try {
        const { data: ocrResult, error: fnError } = await supabase.functions.invoke('process-nf', {
          body: { fileUrl },
        });
        if (fnError) throw fnError;

        // 5. Update nf_uploads with extracted data
        await supabase
          .from('nf_uploads')
          .update({
            supplier: ocrResult.supplier || null,
            total_value: ocrResult.total_value || null,
            status: 'pendente',
          })
          .eq('id', nfRecord.id);

        // 6. Insert extracted items
        if (ocrResult.items && ocrResult.items.length > 0) {
          await supabase.from('nf_items').insert(
            ocrResult.items.map((item: any) => ({
              nf_upload_id: nfRecord.id,
              name: item.name,
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              total_price: item.total_price || 0,
            }))
          );
        }
      } catch (ocrError) {
        // Mark as error but don't fail the whole upload
        await supabase
          .from('nf_uploads')
          .update({ status: 'erro_ocr' })
          .eq('id', nfRecord.id);
        console.error('OCR processing failed:', ocrError);
      }

      return nfRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
      toast.success('NF enviada e processada!');
    },
    onError: (err: any) => {
      console.error('Upload NF error:', err?.message || err);
      toast.error(`Erro ao enviar NF: ${err?.message || 'erro desconhecido'}`);
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nf_uploads'] }); },
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
