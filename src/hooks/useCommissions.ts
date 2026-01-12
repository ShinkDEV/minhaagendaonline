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

export interface ProductSale {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  const { salon, user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      paymentMethod, 
      amount,
      professionalId,
      commissionAmount,
      grossCommissionAmount,
      cardFeeAmount = 0,
      adminFeeAmount = 0,
      productSales = []
    }: { 
      appointmentId: string; 
      paymentMethod: PaymentMethod;
      amount: number;
      professionalId: string;
      commissionAmount: number;
      grossCommissionAmount?: number;
      cardFeeAmount?: number;
      adminFeeAmount?: number;
      productSales?: ProductSale[];
    }) => {
      if (!salon?.id) throw new Error('No salon');

      // Calculate total including products
      const productsTotal = productSales.reduce((acc, p) => acc + (p.price * p.quantity), 0);
      const totalAmount = amount + productsTotal;

      // Update appointment status and total
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          total_amount: totalAmount
        })
        .eq('id', appointmentId);
      if (appointmentError) throw appointmentError;

      // Create payment with total (services + products)
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          salon_id: salon.id,
          appointment_id: appointmentId,
          method: paymentMethod,
          amount: totalAmount,
        });
      if (paymentError) throw paymentError;

      // Create commission with fee details
      const { error: commissionError } = await supabase
        .from('commissions')
        .insert({
          salon_id: salon.id,
          appointment_id: appointmentId,
          professional_id: professionalId,
          amount: commissionAmount,
          gross_amount: grossCommissionAmount || commissionAmount,
          card_fee_amount: cardFeeAmount,
          admin_fee_amount: adminFeeAmount,
          payment_method: paymentMethod,
          status: 'pending',
        });
      if (commissionError) throw commissionError;

      // Create cashflow entry for services income
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

      // Process product sales
      if (productSales.length > 0) {
        // Create cashflow entry for products income
        const { error: productsCashflowError } = await supabase
          .from('cashflow_entries')
          .insert({
            salon_id: salon.id,
            type: 'income',
            amount: productsTotal,
            description: `Venda de produtos (${productSales.map(p => p.name).join(', ')})`,
            related_appointment_id: appointmentId,
          });
        if (productsCashflowError) throw productsCashflowError;

        // Create product movements (stock out)
        for (const sale of productSales) {
          const { error: movementError } = await supabase
            .from('product_movements')
            .insert({
              salon_id: salon.id,
              product_id: sale.productId,
              type: 'out',
              quantity: sale.quantity,
              reason: 'sale',
              notes: `Venda durante atendimento`,
              related_appointment_id: appointmentId,
              created_by: user?.id,
            });
          if (movementError) throw movementError;
        }
      }

      // Create log entry for completion
      if (user?.id) {
        await supabase
          .from('appointment_logs')
          .insert({
            appointment_id: appointmentId,
            user_id: user.id,
            action: 'completed',
            changes: {
              payment_method: paymentMethod,
              total_amount: totalAmount,
              commission_amount: commissionAmount,
              products_sold: productSales.length > 0 ? productSales.map(p => p.name) : undefined,
            },
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-entries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-movements'] });
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
