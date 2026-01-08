import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Professional } from '@/types/database';

export function useProfessionals() {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['professionals', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('active', true)
        .order('display_name');
      
      if (error) throw error;
      return data as Professional[];
    },
    enabled: !!salon?.id,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: { display_name: string; commission_percent_default: number }) => {
      if (!salon?.id) throw new Error('No salon');
      const { error } = await supabase
        .from('professionals')
        .insert({ ...data, salon_id: salon.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Professional> & { id: string }) => {
      const { error } = await supabase
        .from('professionals')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}
