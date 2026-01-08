import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types/database';

export function useClients(search?: string) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['clients', salon?.id, search],
    queryFn: async () => {
      if (!salon?.id) return [];
      let query = supabase
        .from('clients')
        .select('*')
        .eq('salon_id', salon.id)
        .order('full_name');
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!salon?.id,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Client | null;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: { full_name: string; phone?: string; email?: string; notes?: string }) => {
      if (!salon?.id) throw new Error('No salon');
      const { data: result, error } = await supabase
        .from('clients')
        .insert({ ...data, salon_id: salon.id })
        .select()
        .single();
      if (error) throw error;
      return result as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const { error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
