import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Commission, CommissionStatus, PaymentMethod } from '@/types/database';

export function useCommissions(status?: CommissionStatus) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['commissions', salon?.id, status],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      let query = supabase
        .from('commissions')
        .select(`
          *,
          professional:professionals(*),
          appointment:appointments(*, client:clients(*))
        `)
        .eq('salon_id', salon.id)
        .order('calculated_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!salon?.id,
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      paymentMethod, 
      amount,
      professionalId,
      commissionAmount 
    }: { 
      appointmentId: string; 
      paymentMethod: PaymentMethod;
      amount: number;
      professionalId: string;
      commissionAmount: number;
    }) => {
      if (!salon?.id) throw new Error('No salon');

      // Update appointment status
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
      if (appointmentError) throw appointmentError;

      // Create payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          salon_id: salon.id,
          appointment_id: appointmentId,
          method: paymentMethod,
          amount,
        });
      if (paymentError) throw paymentError;

      // Create commission
      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          salon_id: salon.id,
          appointment_id: appointmentId,
          professional_id: professionalId,
          amount: commissionAmount,
          status: 'pending',
        });
      if (commissionError) throw commissionError;

      // Create cashflow entry for income
      const { error: cashflowError } = await supabase
        .from('cashflow_entries')
        .insert({
          salon_id: salon.id,
          type: 'income',
          amount,
          description: 'Atendimento concluído',
          related_appointment_id: appointmentId,
        });
      if (cashflowError) throw cashflowError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-entries'] });
    },
  });
}

export function usePayCommission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
}
