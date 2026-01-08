import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalServiceCommission } from '@/types/database';

export function useServiceCommissions(professionalId?: string) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['service-commissions', salon?.id, professionalId],
    queryFn: async () => {
      if (!salon?.id || !professionalId) return [];
      const { data, error } = await supabase
        .from('professional_service_commissions')
        .select('*, service:services(*)')
        .eq('salon_id', salon.id)
        .eq('professional_id', professionalId);
      
      if (error) throw error;
      return data as (ProfessionalServiceCommission & { service: any })[];
    },
    enabled: !!salon?.id && !!professionalId,
  });
}

export function useUpsertServiceCommission() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      professional_id: string; 
      service_id: string; 
      type: 'percent' | 'fixed'; 
      value: number;
      id?: string;
    }) => {
      if (!salon?.id) throw new Error('No salon');
      
      if (data.id) {
        // Update existing
        const { error } = await supabase
          .from('professional_service_commissions')
          .update({ type: data.type, value: data.value })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('professional_service_commissions')
          .insert({
            salon_id: salon.id,
            professional_id: data.professional_id,
            service_id: data.service_id,
            type: data.type,
            value: data.value,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
    },
  });
}

export function useDeleteServiceCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_service_commissions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-commissions'] });
    },
  });
}