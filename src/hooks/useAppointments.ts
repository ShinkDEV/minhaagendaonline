import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, AppointmentStatus } from '@/types/database';
import { format } from 'date-fns';

export function useAppointments(date?: Date, professionalId?: string) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['appointments', salon?.id, date?.toISOString(), professionalId],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(*),
          client:clients(*),
          appointment_services(*, service:services(*))
        `)
        .eq('salon_id', salon.id)
        .order('start_at');
      
      if (date) {
        const startOfDay = format(date, 'yyyy-MM-dd') + 'T00:00:00';
        const endOfDay = format(date, 'yyyy-MM-dd') + 'T23:59:59';
        query = query.gte('start_at', startOfDay).lte('start_at', endOfDay);
      }
      
      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!salon?.id,
  });
}

export function useMonthAppointmentCounts(month: Date, professionalId?: string) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['appointment-counts', salon?.id, format(month, 'yyyy-MM'), professionalId],
    queryFn: async () => {
      if (!salon?.id) return {};
      
      const startOfMonth = format(month, 'yyyy-MM') + '-01T00:00:00';
      const endOfMonth = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd') + 'T23:59:59';
      
      let query = supabase
        .from('appointments')
        .select('start_at, status')
        .eq('salon_id', salon.id)
        .gte('start_at', startOfMonth)
        .lte('start_at', endOfMonth)
        .neq('status', 'cancelled');
      
      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Count appointments per day
      const counts: Record<string, number> = {};
      data?.forEach(apt => {
        const day = format(new Date(apt.start_at), 'yyyy-MM-dd');
        counts[day] = (counts[day] || 0) + 1;
      });
      
      return counts;
    },
    enabled: !!salon?.id,
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(*),
          client:clients(*),
          appointment_services(*, service:services(*))
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Appointment | null;
    },
    enabled: !!id,
  });
}

interface CreateAppointmentData {
  professional_id: string;
  client_id?: string;
  start_at: string;
  end_at: string;
  total_amount: number;
  notes?: string;
  services: { service_id: string; price_charged: number; duration_minutes: number }[];
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { salon, user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!salon?.id || !user?.id) throw new Error('No salon or user');
      
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          salon_id: salon.id,
          professional_id: data.professional_id,
          client_id: data.client_id || null,
          start_at: data.start_at,
          end_at: data.end_at,
          total_amount: data.total_amount,
          notes: data.notes || null,
          created_by: user.id,
          status: 'confirmed',
        })
        .select()
        .single();
      
      if (appointmentError) throw appointmentError;

      // Insert appointment services
      if (data.services.length > 0) {
        const { error: servicesError } = await supabase
          .from('appointment_services')
          .insert(
            data.services.map(s => ({
              appointment_id: appointment.id,
              service_id: s.service_id,
              price_charged: s.price_charged,
              duration_minutes: s.duration_minutes,
            }))
          );
        if (servicesError) throw servicesError;
      }

      // Create log entry for creation
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: appointment.id,
          user_id: user.id,
          action: 'created',
          changes: {
            professional_id: data.professional_id,
            client_id: data.client_id,
            start_at: data.start_at,
            end_at: data.end_at,
            total_amount: data.total_amount,
            services: data.services.map(s => s.service_id),
          },
        });

      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, cancelled_reason }: { id: string; status: AppointmentStatus; cancelled_reason?: string }) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('appointments')
        .update({ status, cancelled_reason })
        .eq('id', id);
      if (error) throw error;

      // Create log entry for status change
      const action = status === 'cancelled' ? 'cancelled' : 'status_changed';
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: id,
          user_id: user.id,
          action,
          changes: {
            new_status: status,
            ...(cancelled_reason && { cancelled_reason }),
          },
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAddAppointmentService() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      service 
    }: { 
      appointmentId: string; 
      service: { service_id: string; price_charged: number; duration_minutes: number } 
    }) => {
      if (!user?.id) throw new Error('No user');

      // Insert the new service
      const { error: serviceError } = await supabase
        .from('appointment_services')
        .insert({
          appointment_id: appointmentId,
          service_id: service.service_id,
          price_charged: service.price_charged,
          duration_minutes: service.duration_minutes,
        });
      if (serviceError) throw serviceError;

      // Get current appointment to update totals
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('total_amount, end_at')
        .eq('id', appointmentId)
        .single();
      if (fetchError) throw fetchError;

      // Update the appointment total and end time
      const newTotal = Number(currentAppointment.total_amount || 0) + service.price_charged;
      const currentEndAt = new Date(currentAppointment.end_at);
      const newEndAt = new Date(currentEndAt.getTime() + service.duration_minutes * 60000);

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          total_amount: newTotal,
          end_at: newEndAt.toISOString(),
        })
        .eq('id', appointmentId);
      if (updateError) throw updateError;

      // Log the addition
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          action: 'service_added',
          changes: {
            service_id: service.service_id,
            price_charged: service.price_charged,
          },
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
  });
}

export function useRemoveAppointmentService() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      appointmentServiceId,
      priceCharged,
      durationMinutes,
    }: { 
      appointmentId: string; 
      appointmentServiceId: string;
      priceCharged: number;
      durationMinutes: number;
    }) => {
      if (!user?.id) throw new Error('No user');

      // Delete the service
      const { error: deleteError } = await supabase
        .from('appointment_services')
        .delete()
        .eq('id', appointmentServiceId);
      if (deleteError) throw deleteError;

      // Get current appointment to update totals
      const { data: currentAppointment, error: fetchError } = await supabase
        .from('appointments')
        .select('total_amount, end_at')
        .eq('id', appointmentId)
        .single();
      if (fetchError) throw fetchError;

      // Update the appointment total and end time
      const newTotal = Math.max(0, Number(currentAppointment.total_amount || 0) - priceCharged);
      const currentEndAt = new Date(currentAppointment.end_at);
      const newEndAt = new Date(currentEndAt.getTime() - durationMinutes * 60000);

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          total_amount: newTotal,
          end_at: newEndAt.toISOString(),
        })
        .eq('id', appointmentId);
      if (updateError) throw updateError;

      // Log the removal
      await supabase
        .from('appointment_logs')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          action: 'service_removed',
          changes: {
            appointment_service_id: appointmentServiceId,
            price_charged: priceCharged,
          },
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment'] });
    },
  });
}
