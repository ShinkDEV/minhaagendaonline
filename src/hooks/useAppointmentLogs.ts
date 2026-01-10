import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AppointmentLog {
  id: string;
  appointment_id: string;
  user_id: string;
  action: string;
  changes: Record<string, any> | null;
  created_at: string;
  user_name?: string;
}

export function useAppointmentLogs(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ['appointment-logs', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return [];
      
      const { data, error } = await supabase
        .from('appointment_logs')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user names for logs
      const userIds = [...new Set(data.map(log => log.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      return data.map(log => ({
        ...log,
        user_name: profileMap.get(log.user_id) || 'Usuário desconhecido',
      })) as AppointmentLog[];
    },
    enabled: !!appointmentId,
  });
}

export function useCreateAppointmentLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      action, 
      changes 
    }: { 
      appointmentId: string; 
      action: string; 
      changes?: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          action,
          changes: changes || null,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointment-logs', variables.appointmentId] });
    },
  });
}

// Helper to format action labels in Portuguese
export function formatLogAction(action: string): string {
  const actions: Record<string, string> = {
    created: 'Criou o agendamento',
    updated: 'Editou o agendamento',
    status_changed: 'Alterou o status',
    completed: 'Concluiu o atendimento',
    cancelled: 'Cancelou o agendamento',
  };
  return actions[action] || action;
}
