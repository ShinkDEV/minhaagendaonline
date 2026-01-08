import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '@/hooks/useAppointments';
import { useProfessionals } from '@/hooks/useProfessionals';
import { Appointment } from '@/types/database';

const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const statusColors: Record<string, string> = {
  confirmed: 'bg-primary',
  completed: 'bg-green-500',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const navigate = useNavigate();
  
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
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month calendar grid */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName) => (
                <div key={dayName} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {dayName}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors touch-manipulation",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : isToday 
                          ? "bg-accent text-accent-foreground"
                          : isCurrentMonth
                            ? "bg-secondary/50 text-foreground hover:bg-secondary"
                            : "text-muted-foreground/50 hover:bg-secondary/30"
                    )}
                  >
                    {format(day, 'd')}
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
              
              {/* Appointments */}
              <div className="absolute top-0 left-14 right-0 bottom-0 pointer-events-none">
                {appointments.filter(a => a.status !== 'cancelled').map((apt) => {
                  const pos = getAppointmentPosition(apt);
                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-lg p-2 pointer-events-auto cursor-pointer text-white",
                        statusColors[apt.status]
                      )}
                      style={{ top: pos.top, height: pos.height }}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                    >
                      <div className="text-xs font-medium truncate">
                        {apt.client?.full_name || 'Cliente'}
                      </div>
                      <div className="text-xs opacity-80 truncate">
                        {apt.professional?.display_name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          onClick={() => navigate('/appointments/new')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
