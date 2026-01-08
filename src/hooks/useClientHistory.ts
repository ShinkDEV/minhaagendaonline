import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientHistoryAppointment {
  id: string;
  start_at: string;
  status: string;
  total_amount: number;
  professional: {
    display_name: string;
  } | null;
  appointment_services: {
    service_id: string;
    price_charged: number;
    service: {
      id: string;
      name: string;
    } | null;
  }[];
}

export interface ClientStats {
  totalSpent: number;
  appointmentCount: number;
  completedCount: number;
  cancelledCount: number;
  topServices: { name: string; count: number }[];
  lastVisit: string | null;
}

export function useClientHistory(clientId: string | undefined) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['client-history', clientId, salon?.id],
    queryFn: async () => {
      if (!clientId || !salon?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_at,
          status,
          total_amount,
          professional:professionals(display_name),
          appointment_services(
            service_id,
            price_charged,
            service:services(id, name)
          )
        `)
        .eq('salon_id', salon.id)
        .eq('client_id', clientId)
        .order('start_at', { ascending: false });

      if (error) throw error;
      return data as ClientHistoryAppointment[];
    },
    enabled: !!clientId && !!salon?.id,
  });
}

export function useClientStats(clientId: string | undefined) {
  const { data: history = [], isLoading } = useClientHistory(clientId);

  const stats: ClientStats = {
    totalSpent: 0,
    appointmentCount: history.length,
    completedCount: 0,
    cancelledCount: 0,
    topServices: [],
    lastVisit: null,
  };

  if (history.length > 0) {
    const serviceCount: Record<string, { name: string; count: number }> = {};

    history.forEach((apt) => {
      if (apt.status === 'completed') {
        stats.completedCount++;
        stats.totalSpent += Number(apt.total_amount) || 0;
      } else if (apt.status === 'cancelled') {
        stats.cancelledCount++;
      }

      apt.appointment_services?.forEach((as) => {
        if (as.service) {
          if (!serviceCount[as.service.id]) {
            serviceCount[as.service.id] = { name: as.service.name, count: 0 };
          }
          serviceCount[as.service.id].count++;
        }
      });
    });

    // Get last completed visit
    const lastCompleted = history.find(h => h.status === 'completed');
    stats.lastVisit = lastCompleted?.start_at || null;

    // Sort services by count and take top 5
    stats.topServices = Object.values(serviceCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  return { stats, isLoading };
}
