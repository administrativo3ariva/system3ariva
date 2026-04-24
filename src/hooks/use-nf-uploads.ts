import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

export type FinancialLinkType = 'expense' | 'payment' | null;

export type DbNfItem = {
  id: string;
  nf_upload_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  unit_of_measure?: string;
  financial_link_type?: FinancialLinkType;
};

export type DbNfUpload = {
  id: string;
  file_name: string;
  file_url?: string | null;
  upload_date: string;
  issue_date?: string | null;
  status: string;
  supplier: string | null;
  supplier_cnpj?: string | null;
  recipient_name?: string | null;
  recipient_doc?: string | null;
  recipient_doc_type?: string | null;
  recipient_city?: string | null;
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
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; supplier?: string; supplier_cnpj?: string; recipient_name?: string; recipient_doc?: string; recipient_doc_type?: string; recipient_city?: string; total_value?: number; freight_value?: number; other_expenses?: number; discount_value?: number; issue_date?: string }) => {
      const { error } = await supabase.from('nf_uploads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
    },
    onError: () => toast.error('Erro ao atualizar NF'),
  });
}

function branchToCostCenter(unit: string): string {
  const map: Record<string, string> = {
    'BH-Matriz': 'BH', 'Vêneto-BH': 'BH', 'Vêneto-SP': 'SP',
    'SP': 'SP', 'RJ': 'RJ', 'PAG': 'PAG', 'VAG': 'VAG',
    'FLO': 'FLO', 'ITA': 'ITA', 'CPN': 'CPN',
    'LIM': 'LIM', 'JUN': 'JUN', 'SJC': 'SJC',
  };
  return map[unit] || 'BH';
}

export function useApproveNf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nf: DbNfUpload) => {
      const items = nf.nf_items || [];

      // 1) Persist per-item category + financial_link_type so they survive
      for (const item of items) {
        await supabase
          .from('nf_items')
          .update({
            category: item.category || null,
            financial_link_type: item.financial_link_type || null,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            unit_of_measure: item.unit_of_measure || 'UN',
          })
          .eq('id', item.id);
      }

      const targetUnit = nf.unit || 'BH-Matriz';

      // 2) Stock movements (entrada) for every item
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

      // 3) Group items by financial link type and create financial entries
      const expenseItems = items.filter(i => i.financial_link_type === 'expense');
      const paymentItems = items.filter(i => i.financial_link_type === 'payment');

      const expenseTotal = expenseItems.reduce((s, i) => s + Number(i.total_price || 0), 0);
      const paymentTotal = paymentItems.reduce((s, i) => s + Number(i.total_price || 0), 0);

      const cc = branchToCostCenter(targetUnit);
      const baseDescription = `NF ${nf.file_name}${nf.supplier ? ` — ${nf.supplier}` : ''}`;
      let createdExpense = false;
      let createdPayment = false;

      if (expenseItems.length > 0 && expenseTotal > 0) {
        const { error } = await supabase.from('expenses').insert({
          description: baseDescription,
          amount: expenseTotal,
          category: expenseItems[0].category || 'Outros',
          company: targetUnit,
          cost_center: cc,
          expense_date: nf.issue_date || new Date().toISOString().slice(0, 10),
          supplier: nf.supplier || null,
          status: 'pendente',
          receipt_url: nf.file_url || null,
          notes: `Vinculado automaticamente da NF ${nf.id}`,
        });
        if (error) throw error;
        createdExpense = true;
      }

      if (paymentItems.length > 0 && paymentTotal > 0) {
        const { error } = await supabase.from('payment_requests').insert({
          description: baseDescription,
          amount: paymentTotal,
          category: paymentItems[0].category || 'Outros',
          company: targetUnit,
          cost_center: cc,
          request_date: new Date().toISOString().slice(0, 10),
          due_date: nf.issue_date || null,
          supplier: nf.supplier || null,
          status: 'pendente',
          receipt_url: nf.file_url || null,
          notes: `Vinculado automaticamente da NF ${nf.id}`,
        });
        if (error) throw error;
        createdPayment = true;
      }

      // 4) Mark NF as approved (or vinculado if any link was created)
      const finalStatus = (createdExpense || createdPayment) ? 'vinculado' : 'aprovado';
      const { error: updateError } = await supabase
        .from('nf_uploads')
        .update({ status: finalStatus })
        .eq('id', nf.id);
      if (updateError) throw updateError;

      return { createdExpense, createdPayment };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['nf_uploads'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['payment_requests'] });

      const parts: string[] = ['Itens adicionados ao estoque'];
      if (result?.createdExpense) parts.push('despesa lançada');
      if (result?.createdPayment) parts.push('solicitação criada');
      toast.success(`NF aprovada — ${parts.join(', ')}.`);
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
