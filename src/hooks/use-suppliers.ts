import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  name: string;
  cnpj_cpf?: string | null;
  payment_method?: string | null;
  pix_key?: string | null;
  bank_name?: string | null;
  bank_agency?: string | null;
  bank_account?: string | null;
  bank_account_type?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at: string;
  updated_at: string;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Supplier[];
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('suppliers').insert(supplier as any).select().single();
      if (error) throw error;
      return data as Supplier;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
