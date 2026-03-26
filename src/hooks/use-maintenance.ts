import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceTask } from '@/lib/types';
import { toast } from 'sonner';

export function useMaintenanceTasks(branch?: string) {
  return useQuery({
    queryKey: ['maintenance-tasks', branch],
    queryFn: async () => {
      let query = supabase.from('maintenance_tasks').select('*').order('due_date', { ascending: true });
      if (branch) query = query.eq('branch', branch);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as MaintenanceTask[];
    },
  });
}

export function useCreateMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<MaintenanceTask>) => {
      const { data, error } = await supabase.from('maintenance_tasks').insert(task as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      toast.success('Manutenção criada com sucesso');
    },
    onError: () => toast.error('Erro ao criar manutenção'),
  });
}

export function useUpdateMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaintenanceTask> & { id: string }) => {
      const { data, error } = await supabase.from('maintenance_tasks').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      toast.success('Manutenção atualizada');
    },
    onError: () => toast.error('Erro ao atualizar manutenção'),
  });
}

export function useDeleteMaintenanceTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      toast.success('Manutenção excluída');
    },
    onError: () => toast.error('Erro ao excluir manutenção'),
  });
}
