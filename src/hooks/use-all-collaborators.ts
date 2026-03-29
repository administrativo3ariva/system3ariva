import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbCollaborator } from './use-collaborators';

/** Fetches ALL collaborators across all branches */
export function useAllCollaborators() {
  return useQuery({
    queryKey: ['collaborators-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as DbCollaborator[];
    },
  });
}
