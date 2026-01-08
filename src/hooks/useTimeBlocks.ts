import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isWithinInterval, getDay, startOfDay, endOfDay, addDays } from 'date-fns';

export interface TimeBlock {
  id: string;
  salon_id: string;
  professional_id: string;
  title: string;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_days: number[] | null;
  recurrence_end_date: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export function useTimeBlocks(professionalId?: string) {
  const { salon } = useAuth();

  return useQuery({
    queryKey: ['time-blocks', salon?.id, professionalId],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      let query = supabase
        .from('time_blocks')
        .select('*')
        .eq('salon_id', salon.id)
        .order('start_at', { ascending: false });
      
      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TimeBlock[];
    },
    enabled: !!salon?.id,
  });
}

export interface CreateTimeBlockData {
  professional_id: string;
  title: string;
  start_at: string;
  end_at: string;
  is_recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | null;
  recurrence_days?: number[] | null;
  recurrence_end_date?: string | null;
  notes?: string | null;
}

export function useCreateTimeBlock() {
  const queryClient = useQueryClient();
  const { salon, user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateTimeBlockData) => {
      if (!salon?.id) throw new Error('Salão não encontrado');
      
      const { data: result, error } = await supabase
        .from('time_blocks')
        .insert({
          ...data,
          salon_id: salon.id,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
    },
  });
}

export function useDeleteTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-blocks'] });
    },
  });
}

// Helper function to check if a specific time slot is blocked
export function isTimeSlotBlocked(
  blocks: TimeBlock[],
  professionalId: string,
  date: Date,
  timeSlot: string
): boolean {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStart = new Date(date);
  slotStart.setHours(hours, minutes, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-minute slots

  const professionalBlocks = blocks.filter(b => b.professional_id === professionalId);

  for (const block of professionalBlocks) {
    const blockStart = parseISO(block.start_at);
    const blockEnd = parseISO(block.end_at);

    if (block.is_recurring) {
      // Handle recurring blocks
      const dayOfWeek = getDay(date);
      
      if (block.recurrence_type === 'daily') {
        // Check if within recurrence period
        if (block.recurrence_end_date && date > parseISO(block.recurrence_end_date)) {
          continue;
        }
        // Check if time overlaps
        const blockStartTime = format(blockStart, 'HH:mm');
        const blockEndTime = format(blockEnd, 'HH:mm');
        if (timeSlot >= blockStartTime && timeSlot < blockEndTime) {
          return true;
        }
      } else if (block.recurrence_type === 'weekly') {
        // Check if it's the right day of week
        if (block.recurrence_days && block.recurrence_days.includes(dayOfWeek)) {
          if (block.recurrence_end_date && date > parseISO(block.recurrence_end_date)) {
            continue;
          }
          const blockStartTime = format(blockStart, 'HH:mm');
          const blockEndTime = format(blockEnd, 'HH:mm');
          if (timeSlot >= blockStartTime && timeSlot < blockEndTime) {
            return true;
          }
        }
      }
    } else {
      // One-time block - check if slot falls within the block period
      if (
        isWithinInterval(slotStart, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
        (slotStart <= blockStart && slotEnd >= blockEnd)
      ) {
        return true;
      }
    }
  }

  return false;
}
