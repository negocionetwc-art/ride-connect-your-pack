import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Ride = Database['public']['Tables']['rides']['Row'];

export function useRides(userId?: string) {
  return useQuery({
    queryKey: ['rides', userId],
    queryFn: async (): Promise<Ride[]> => {
      let query = supabase
        .from('rides')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('user_id', user.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Ride[];
    },
  });
}
