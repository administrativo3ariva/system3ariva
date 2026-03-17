import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DbCollaborator = {
  id: string;
  name: string;
  unit: string;
  department: string;
  active: boolean;
  floor: string | null;
};

export function useCollaborators() {
  return useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => {
      const { data, error } = await supabase.from('collaborators').select('*').order('name');
      if (error) throw error;
      return data as DbCollaborator[];
    },
  });
}

export function useAddCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<DbCollaborator, 'id'>) => {
      const { data, error } = await supabase.from('collaborators').insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborators'] }); toast.success('Colaborador cadastrado'); },
    onError: () => toast.error('Erro ao cadastrar colaborador'),
  });
}

export function useUpdateCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbCollaborator> & { id: string }) => {
      const { error } = await supabase.from('collaborators').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collaborators'] }); },
    onError: () => toast.error('Erro ao atualizar colaborador'),
  });
}
