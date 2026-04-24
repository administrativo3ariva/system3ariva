import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePaymentRequests() {
  return useQuery({
    queryKey: ['payment_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: {
      description: string;
      amount: number;
      cost_center: string;
      company: string;
      category: string;
      supplier?: string;
      request_date?: string;
      due_date?: string;
      payment_method?: string;
      pix_key?: string;
      bank_name?: string;
      bank_agency?: string;
      bank_account?: string;
      bank_account_type?: string;
      boleto_url?: string;
      receipt_url?: string;
      supplier_id?: string;
      notes?: string;
      allocations?: Array<{ category: string; amount: number }> | null;
    }) => {
      const { data, error } = await supabase.from('payment_requests').insert(req as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment_requests'] });
      toast.success('Solicitação criada com sucesso');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; description?: string; amount?: number; cost_center?: string; company?: string; category?: string; supplier?: string; due_date?: string; payment_date?: string; payment_method?: string; pix_key?: string; bank_name?: string; bank_agency?: string; bank_account?: string; bank_account_type?: string; boleto_url?: string; receipt_url?: string; supplier_id?: string; notes?: string; allocations?: Array<{ category: string; amount: number }> | null }) => {
      const { data, error } = await supabase.from('payment_requests').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment_requests'] });
      toast.success('Solicitação atualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment_requests'] });
      toast.success('Solicitação removida');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
