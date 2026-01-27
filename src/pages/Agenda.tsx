import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Plus, XCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAppointments, useMonthAppointmentCounts } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useTimeBlocks, TimeBlock } from '@/hooks/useTimeBlocks';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types/database';

const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

// Professional colors palette - vibrant, distinguishable colors
const professionalColors = [
  { bg: 'bg-violet-500', border: 'border-violet-600' },
  { bg: 'bg-blue-500', border: 'border-blue-600' },
  { bg: 'bg-emerald-500', border: 'border-emerald-600' },
  { bg: 'bg-amber-500', border: 'border-amber-600' },
  { bg: 'bg-rose-500', border: 'border-rose-600' },
  { bg: 'bg-cyan-500', border: 'border-cyan-600' },
  { bg: 'bg-fuchsia-500', border: 'border-fuchsia-600' },
  { bg: 'bg-orange-500', border: 'border-orange-600' },
  { bg: 'bg-teal-500', border: 'border-teal-600' },
  { bg: 'bg-indigo-500', border: 'border-indigo-600' },
];

const getProfessionalColor = (professionalId: string, professionals: { id: string }[]) => {
  const index = professionals.findIndex(p => p.id === professionalId);
  return professionalColors[index % professionalColors.length];
};

const statusColors: Record<string, string> = {
  confirmed: '', // Will use professional color instead
  completed: 'bg-green-500',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

// Helper to get block positions for the time grid
interface BlockPosition {
  id: string;
  title: string;
  professionalName: string;
  top: string;
  height: string;
}

function getBlocksForDate(
  blocks: TimeBlock[],
  date: Date,
  professionals: { id: string; display_name: string }[],
  selectedProfessional: string
): BlockPosition[] {
  const result: BlockPosition[] = [];
  const dayOfWeek = getDay(date);
  const dateStr = format(date, 'yyyy-MM-dd');

  const filteredBlocks = selectedProfessional !== 'all'
    ? blocks.filter(b => b.professional_id === selectedProfessional)
    : blocks;

  for (const block of filteredBlocks) {
    let applies = false;
    let startTime: string;
    let endTime: string;

    const blockStart = parseISO(block.start_at);
    const blockEnd = parseISO(block.end_at);

    if (block.is_recurring) {
      // Check recurrence end date
      if (block.recurrence_end_date && date > parseISO(block.recurrence_end_date)) {
        continue;
      }

      if (block.recurrence_type === 'daily') {
        applies = true;
      } else if (block.recurrence_type === 'weekly') {
        applies = block.recurrence_days?.includes(dayOfWeek) || false;
      }

      if (applies) {
        startTime = format(blockStart, 'HH:mm');
        endTime = format(blockEnd, 'HH:mm');
      }
    } else {
      // One-time block - check if date is within range
      const blockStartDate = format(blockStart, 'yyyy-MM-dd');
      const blockEndDate = format(blockEnd, 'yyyy-MM-dd');
      
      if (dateStr >= blockStartDate && dateStr <= blockEndDate) {
        applies = true;
        // For multi-day blocks, show full day on intermediate days
        if (dateStr === blockStartDate) {
          startTime = format(blockStart, 'HH:mm');
        } else {
          startTime = '08:00';
        }
        if (dateStr === blockEndDate) {
          endTime = format(blockEnd, 'HH:mm');
        } else {
          endTime = '20:00';
        }
      }
    }

    if (applies) {
      const [startH, startM] = startTime!.split(':').map(Number);
      const [endH, endM] = endTime!.split(':').map(Number);
      
      const startHour = startH - 8;
      const endHour = endH - 8;
      
      // Only show if within visible hours (8-20)
      if (endH > 8 && startH < 20) {
        const clampedStartHour = Math.max(startHour, 0);
        const clampedEndHour = Math.min(endHour, 12);
        const clampedStartMin = startHour < 0 ? 0 : startM;
        const clampedEndMin = endHour > 12 ? 0 : endM;
        
        const top = (clampedStartHour * 60 + clampedStartMin) * (64 / 60);
        const height = Math.max(
          ((clampedEndHour - clampedStartHour) * 60 + (clampedEndMin - clampedStartMin)) * (64 / 60),
          24
        );

        const prof = professionals.find(p => p.id === block.professional_id);
        
        result.push({
          id: block.id,
          title: block.title,
          professionalName: prof?.display_name || '',
          top: `${top}px`,
          height: `${height}px`,
        });
      }
    }
  }

  return result;
}

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [showCancelled, setShowCancelled] = useState(false);
  const navigate = useNavigate();
  const { trialCancelled } = useAuth();
  
  // Generate all days for the month view (including days from prev/next month to fill the grid)
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const { data: professionals = [] } = useProfessionals();
  const { data: appointments = [] } = useAppointments(
    selectedDate,
    selectedProfessional !== 'all' ? selectedProfessional : undefined
  );
  const { data: appointmentCounts = {} } = useMonthAppointmentCounts(
    selectedDate,
    selectedProfessional !== 'all' ? selectedProfessional : undefined
  );
  const { data: timeBlocks = [] } = useTimeBlocks();

  // Get blocks that apply to the selected date
  const blocksForDate = useMemo(
    () => getBlocksForDate(timeBlocks, selectedDate, professionals, selectedProfessional),
    [timeBlocks, selectedDate, professionals, selectedProfessional]
  );

  // Cancelled appointments for the day
  const cancelledAppointments = useMemo(
    () => appointments.filter(a => a.status === 'cancelled'),
    [appointments]
  );

  const getAppointmentPosition = (apt: Appointment) => {
    const start = new Date(apt.start_at);
    const end = new Date(apt.end_at);
    const startHour = start.getHours() - 8;
    const startMin = start.getMinutes();
    const endHour = end.getHours() - 8;
    const endMin = end.getMinutes();
    
    const top = (startHour * 60 + startMin) * (64 / 60);
    const height = Math.max(((endHour - startHour) * 60 + (endMin - startMin)) * (64 / 60), 32);
    
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, -1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Professional filter */}
        <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os profissionais" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {professionals.map((prof, index) => {
              const color = professionalColors[index % professionalColors.length];
              return (
                <SelectItem key={prof.id} value={prof.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", color.bg)} />
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={prof.avatar_url || undefined} alt={prof.display_name} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {prof.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {prof.display_name}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Month calendar grid */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayName, idx) => (
                <div key={idx} className="text-center text-[10px] font-medium text-muted-foreground">
                  {dayName}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, selectedDate);
                const dayKey = format(day, 'yyyy-MM-dd');
                const count = appointmentCounts[dayKey] || 0;
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "h-8 w-full flex flex-col items-center justify-center rounded text-xs font-medium transition-colors touch-manipulation relative",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : isToday 
                          ? "bg-accent text-accent-foreground"
                          : isCurrentMonth
                            ? "text-foreground hover:bg-secondary"
                            : "text-muted-foreground/40"
                    )}
                  >
                    {format(day, 'd')}
                    {count > 0 && isCurrentMonth && (
                      <span className={cn(
                        "text-[8px] leading-none",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time grid */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="flex h-16 border-b border-border last:border-b-0">
                  <div className="w-14 flex-shrink-0 text-xs text-muted-foreground p-2 border-r border-border">
                    {hour}
                  </div>
                  <div className="flex-1 relative" />
                </div>
              ))}
              
              {/* Time Blocks */}
              <div className="absolute top-0 left-14 right-0 bottom-0 pointer-events-none">
                {blocksForDate.map((block) => (
                  <div
                    key={block.id}
                    className="absolute left-1 right-1 rounded-lg p-2 bg-muted/80 border-2 border-dashed border-muted-foreground/30"
                    style={{ top: block.top, height: block.height }}
                  >
                    <div className="text-xs font-medium text-muted-foreground truncate">
                      {block.title}
                    </div>
                    {selectedProfessional === 'all' && block.professionalName && (
                      <div className="text-xs text-muted-foreground/70 truncate">
                        {block.professionalName}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Appointments */}
              <div className="absolute top-0 left-14 right-0 bottom-0 pointer-events-none">
                {appointments.filter(a => a.status !== 'cancelled').map((apt) => {
                  const pos = getAppointmentPosition(apt);
                  const prof = apt.professional;
                  const profColor = prof ? getProfessionalColor(prof.id, professionals) : professionalColors[0];
                  const bgClass = apt.status === 'completed' ? 'bg-green-500' : profColor.bg;
                  
                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg p-2 pointer-events-auto cursor-pointer text-white shadow-sm",
                        bgClass
                      )}
                      style={{ top: pos.top, height: pos.height }}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                    >
                      <div className="flex items-start gap-2">
                        {prof?.avatar_url && (
                          <Avatar className="h-6 w-6 flex-shrink-0 border border-white/30">
                            <AvatarImage src={prof.avatar_url} alt={prof.display_name} />
                            <AvatarFallback className="text-[8px] bg-white/20">
                              {prof.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {apt.client?.full_name || 'Cliente'}
                          </div>
                          <div className="text-xs opacity-80 truncate">
                            {prof?.display_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Appointments Section */}
        {cancelledAppointments.length > 0 && (
          <Collapsible open={showCancelled} onOpenChange={setShowCancelled}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {cancelledAppointments.length} cancelamento{cancelledAppointments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      showCancelled && "rotate-180"
                    )} />
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2">
                  {cancelledAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-through text-muted-foreground">
                            {apt.client?.full_name || 'Cliente não informado'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.professional?.display_name} • {format(parseISO(apt.start_at), 'HH:mm')} - {format(parseISO(apt.end_at), 'HH:mm')}
                          </p>
                          {apt.cancelled_reason && (
                            <p className="text-xs text-destructive/80">
                              Motivo: {apt.cancelled_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* FAB */}
        {!trialCancelled && (
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            onClick={() => navigate('/appointments/new')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
