import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SalonWorkingHour {
  id: string;
  salon_id: string;
  weekday: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
}

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export { WEEKDAYS };

export function useSalonWorkingHours() {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['salon-working-hours', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      const { data, error } = await supabase
        .from('salon_working_hours')
        .select('*')
        .eq('salon_id', salon.id)
        .order('weekday');
      
      if (error) throw error;
      return data as SalonWorkingHour[];
    },
    enabled: !!salon?.id,
  });
}

export interface UpsertSalonWorkingHourData {
  weekday: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

export function useUpsertSalonWorkingHours() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: UpsertSalonWorkingHourData[]) => {
      if (!salon?.id) throw new Error('Salão não encontrado');
      
      // Delete all existing and insert new
      const { error: deleteError } = await supabase
        .from('salon_working_hours')
        .delete()
        .eq('salon_id', salon.id);
      
      if (deleteError) throw deleteError;

      // Only insert days that are open or have been configured
      const toInsert = data.map(item => ({
        salon_id: salon.id,
        weekday: item.weekday,
        is_open: item.is_open,
        start_time: item.start_time,
        end_time: item.end_time,
      }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('salon_working_hours')
          .insert(toInsert);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salon-working-hours'] });
    },
  });
}
