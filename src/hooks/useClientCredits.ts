import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CreditMovement {
  id: string;
  salon_id: string;
  client_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export function useClientCreditMovements(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client-credit-movements', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('client_credit_movements')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CreditMovement[];
    },
    enabled: !!clientId,
  });
}

export function useAddCreditMovement() {
  const queryClient = useQueryClient();
  const { salon } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      client_id: string;
      amount: number;
      type: 'credit' | 'debit';
      description?: string;
    }) => {
      if (!salon?.id) throw new Error('No salon');
      const { error } = await supabase
        .from('client_credit_movements')
        .insert({
          salon_id: salon.id,
          client_id: data.client_id,
          amount: data.amount,
          type: data.type,
          description: data.description || null,
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-credit-movements', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: variables.type === 'credit' ? 'Crédito adicionado!' : 'Débito registrado!',
      });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });
}
