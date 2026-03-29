import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbMovement } from './use-movements';

/** Fetches ALL movements across all branches (no unit filter) */
export function useAllMovements() {
  return useQuery({
    queryKey: ['movements-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as DbMovement[];
    },
  });
}
