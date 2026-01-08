import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export interface DailyRevenue {
  date: string;
  revenue: number;
  count: number;
}

export interface ProfessionalRanking {
  id: string;
  name: string;
  revenue: number;
  appointments: number;
}

export interface ServiceRanking {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

// Revenue for last 7 days
export function useWeeklyRevenue() {
  const { salon } = useAuth();
  const endDate = new Date();
  const startDate = startOfWeek(endDate, { weekStartsOn: 0 });

  return useQuery({
    queryKey: ['weekly-revenue', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const result: DailyRevenue[] = [];

      const { data, error } = await supabase
        .from('appointments')
        .select('start_at, total_amount, status')
        .eq('salon_id', salon.id)
        .eq('status', 'completed')
        .gte('start_at', startDate.toISOString())
        .lte('start_at', endDate.toISOString());

      if (error) throw error;

      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayAppointments = data?.filter(
          a => format(new Date(a.start_at), 'yyyy-MM-dd') === dayStr
        ) || [];
        
        result.push({
          date: format(day, 'EEE', { locale: undefined }).substring(0, 3),
          revenue: dayAppointments.reduce((sum, a) => sum + Number(a.total_amount || 0), 0),
          count: dayAppointments.length,
        });
      });

      return result;
    },
    enabled: !!salon?.id,
  });
}

// Monthly revenue comparison (current vs last month)
export function useMonthlyRevenue() {
  const { salon } = useAuth();
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  return useQuery({
    queryKey: ['monthly-revenue', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return { current: 0, previous: 0, growth: 0 };

      // Current month
      const { data: currentData } = await supabase
        .from('appointments')
        .select('total_amount')
        .eq('salon_id', salon.id)
        .eq('status', 'completed')
        .gte('start_at', currentMonthStart.toISOString())
        .lte('start_at', currentMonthEnd.toISOString());

      // Last month
      const { data: previousData } = await supabase
        .from('appointments')
        .select('total_amount')
        .eq('salon_id', salon.id)
        .eq('status', 'completed')
        .gte('start_at', lastMonthStart.toISOString())
        .lte('start_at', lastMonthEnd.toISOString());

      const current = currentData?.reduce((sum, a) => sum + Number(a.total_amount || 0), 0) || 0;
      const previous = previousData?.reduce((sum, a) => sum + Number(a.total_amount || 0), 0) || 0;
      const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return { current, previous, growth };
    },
    enabled: !!salon?.id,
  });
}

// Professional ranking by revenue (current month)
export function useProfessionalRanking() {
  const { salon } = useAuth();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  return useQuery({
    queryKey: ['professional-ranking', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          total_amount,
          professional:professionals(id, display_name)
        `)
        .eq('salon_id', salon.id)
        .eq('status', 'completed')
        .gte('start_at', monthStart.toISOString())
        .lte('start_at', monthEnd.toISOString());

      if (error) throw error;

      const ranking: Record<string, ProfessionalRanking> = {};

      data?.forEach(apt => {
        const prof = apt.professional as any;
        if (!prof) return;
        
        if (!ranking[prof.id]) {
          ranking[prof.id] = {
            id: prof.id,
            name: prof.display_name,
            revenue: 0,
            appointments: 0,
          };
        }
        ranking[prof.id].revenue += Number(apt.total_amount || 0);
        ranking[prof.id].appointments++;
      });

      return Object.values(ranking)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
    enabled: !!salon?.id,
  });
}

// Service ranking by count (current month)
export function useServiceRanking() {
  const { salon } = useAuth();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  return useQuery({
    queryKey: ['service-ranking', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          appointment_services(
            price_charged,
            service:services(id, name)
          )
        `)
        .eq('salon_id', salon.id)
        .eq('status', 'completed')
        .gte('start_at', monthStart.toISOString())
        .lte('start_at', monthEnd.toISOString());

      if (error) throw error;

      const ranking: Record<string, ServiceRanking> = {};

      data?.forEach(apt => {
        apt.appointment_services?.forEach((as: any) => {
          const service = as.service;
          if (!service) return;
          
          if (!ranking[service.id]) {
            ranking[service.id] = {
              id: service.id,
              name: service.name,
              count: 0,
              revenue: 0,
            };
          }
          ranking[service.id].count++;
          ranking[service.id].revenue += Number(as.price_charged || 0);
        });
      });

      return Object.values(ranking)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    enabled: !!salon?.id,
  });
}
