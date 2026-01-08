import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CashflowEntry, CashflowCategory, CashflowType } from '@/types/database';

export function useCashflowCategories() {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['cashflow-categories', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('*')
        .eq('salon_id', salon.id)
        .order('name');
      
      if (error) throw error;
      return data as CashflowCategory[];
    },
    enabled: !!salon?.id,
  });
}

export function useCashflowEntries(startDate?: Date, endDate?: Date) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['cashflow-entries', salon?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      let query = supabase
        .from('cashflow_entries')
        .select('*, category:cashflow_categories(*)')
        .eq('salon_id', salon.id)
        .order('occurred_at', { ascending: false });
      
      if (startDate) {
        query = query.gte('occurred_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('occurred_at', endDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (CashflowEntry & { category: CashflowCategory | null })[];
    },
    enabled: !!salon?.id,
  });
}

export function useCreateCashflowEntry() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      type: CashflowType; 
      category_id?: string; 
      amount: number; 
      description?: string;
      occurred_at?: string;
      related_appointment_id?: string;
    }) => {
      if (!salon?.id) throw new Error('No salon');
      const { error } = await supabase
        .from('cashflow_entries')
        .insert({ 
          ...data, 
          salon_id: salon.id,
          occurred_at: data.occurred_at || new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflow-entries'] });
    },
  });
}
