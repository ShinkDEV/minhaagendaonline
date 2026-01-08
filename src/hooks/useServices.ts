import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types/database';

export function useServices() {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['services', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salon.id)
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!salon?.id,
  });
}

export function useActiveServices() {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['services', salon?.id, 'active'],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!salon?.id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; duration_minutes: number; price: number }) => {
      if (!salon?.id) throw new Error('No salon');
      const { error } = await supabase
        .from('services')
        .insert({ ...data, salon_id: salon.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: string }) => {
      const { error } = await supabase
        .from('services')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
