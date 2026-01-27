import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDay } from 'date-fns';

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

// Helper function to check if salon is open on a specific date
export function isSalonOpenOnDate(
  workingHours: SalonWorkingHour[],
  date: Date
): boolean {
  if (workingHours.length === 0) return true; // No config = always open (default)
  
  const dayOfWeek = getDay(date);
  const dayConfig = workingHours.find(h => h.weekday === dayOfWeek);
  
  // If no config for this day, assume closed
  if (!dayConfig) return false;
  
  return dayConfig.is_open;
}

// Helper function to get salon operating hours for a specific date
export function getSalonHoursForDate(
  workingHours: SalonWorkingHour[],
  date: Date
): { start_time: string; end_time: string } | null {
  if (workingHours.length === 0) {
    // Default hours if not configured
    return { start_time: '09:00', end_time: '18:00' };
  }
  
  const dayOfWeek = getDay(date);
  const dayConfig = workingHours.find(h => h.weekday === dayOfWeek);
  
  if (!dayConfig || !dayConfig.is_open) return null;
  
  return {
    start_time: dayConfig.start_time,
    end_time: dayConfig.end_time,
  };
}

// Helper function to check if a time slot is within salon operating hours
export function isTimeSlotWithinSalonHours(
  workingHours: SalonWorkingHour[],
  date: Date,
  timeSlot: string
): boolean {
  const hours = getSalonHoursForDate(workingHours, date);
  
  if (!hours) return false; // Salon is closed
  
  // Compare time strings directly (HH:MM format)
  return timeSlot >= hours.start_time && timeSlot < hours.end_time;
}

// Generate available time slots based on salon hours
export function generateTimeSlotsForDate(
  workingHours: SalonWorkingHour[],
  date: Date,
  intervalMinutes: number = 30
): string[] {
  const hours = getSalonHoursForDate(workingHours, date);
  
  if (!hours) return []; // Salon is closed
  
  const [startHour, startMin] = hours.start_time.split(':').map(Number);
  const [endHour, endMin] = hours.end_time.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;
  
  const slots: string[] = [];
  
  for (let mins = startTotalMinutes; mins < endTotalMinutes; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  
  return slots;
}
