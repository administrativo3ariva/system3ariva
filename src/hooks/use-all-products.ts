import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbProduct } from './use-products';

/** Fetches ALL products across all branches */
export function useAllProducts() {
  return useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbProduct[];
    },
  });
}
