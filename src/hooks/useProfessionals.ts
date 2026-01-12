import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Professional } from '@/types/database';

export interface ProfessionalWithEmail extends Professional {
  user_email: string | null;
}

export function useProfessionals(includeInactive = false) {
  const { salon, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['professionals', salon?.id, includeInactive, isAdmin],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      // For admins, use the RPC function that includes email
      if (isAdmin) {
        const { data, error } = await supabase
          .rpc('get_professionals_with_email', { p_salon_id: salon.id });
        
        if (error) throw error;
        
        let result = data as ProfessionalWithEmail[];
        if (!includeInactive) {
          result = result.filter(p => p.active);
        }
        return result;
      }
      
      // For non-admins, use regular query
      let query = supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salon.id)
        .order('display_name');
      
      if (!includeInactive) {
        query = query.eq('active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data as Professional[]).map(p => ({ ...p, user_email: null })) as ProfessionalWithEmail[];
    },
    enabled: !!salon?.id,
  });
}

export function useCreateProfessional() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      display_name: string; 
      commission_percent_default: number;
      legal_name?: string | null;
      cpf?: string | null;
      position?: string | null;
      bank_name?: string | null;
      bank_agency?: string | null;
      bank_account?: string | null;
      pix_key?: string | null;
      pix_key_type?: string | null;
      can_delete_appointments?: boolean;
    }) => {
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

export function useDeleteProfessional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });
}
