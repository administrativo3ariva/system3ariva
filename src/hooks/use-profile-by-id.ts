import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileBasic {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

/** Fetches basic profile info (name + email) for a given user id. */
export function useProfileById(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['profile-basic', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ProfileBasic | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as ProfileBasic) ?? null;
    },
  });
}

/** Formats a profile as "Name (email)" or fallbacks. */
export function formatProfile(p: ProfileBasic | null | undefined): string {
  if (!p) return 'Não registrado';
  const name = p.full_name?.trim();
  const email = p.email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || 'Não registrado';
}
