import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Save, Loader2 } from 'lucide-react';
import { useSalonWorkingHours, useUpsertSalonWorkingHours, WEEKDAYS } from '@/hooks/useSalonWorkingHours';
import { useToast } from '@/hooks/use-toast';

interface DaySchedule {
  weekday: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = WEEKDAYS.map(day => ({
  weekday: day.value,
  is_open: day.value >= 1 && day.value <= 5, // Mon-Fri open by default
  start_time: '09:00',
  end_time: '18:00',
}));

export function SalonWorkingHoursManager() {
  const { data: savedHours, isLoading } = useSalonWorkingHours();
  const upsertMutation = useUpsertSalonWorkingHours();
  const { toast } = useToast();
  
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved hours when data arrives
  useEffect(() => {
    if (savedHours && savedHours.length > 0) {
      const loadedSchedule = WEEKDAYS.map(day => {
        const saved = savedHours.find(h => h.weekday === day.value);
        if (saved) {
          return {
            weekday: saved.weekday,
            is_open: saved.is_open,
            start_time: saved.start_time,
            end_time: saved.end_time,
          };
        }
        // Default for days not saved
        return {
          weekday: day.value,
          is_open: day.value >= 1 && day.value <= 5,
          start_time: '09:00',
          end_time: '18:00',
        };
      });
      setSchedule(loadedSchedule);
    }
  }, [savedHours]);

  const handleToggleDay = (weekday: number) => {
    setSchedule(prev => 
      prev.map(day => 
        day.weekday === weekday 
          ? { ...day, is_open: !day.is_open }
          : day
      )
    );
    setHasChanges(true);
  };

  const handleTimeChange = (weekday: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => 
      prev.map(day => 
        day.weekday === weekday 
          ? { ...day, [field]: value }
          : day
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync(schedule);
      toast({ title: 'Horários salvos com sucesso!' });
      setHasChanges(false);
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao salvar', 
        description: error.message 
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {WEEKDAYS.map(day => {
          const daySchedule = schedule.find(s => s.weekday === day.value);
          if (!daySchedule) return null;

          return (
            <div 
              key={day.value} 
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                daySchedule.is_open ? 'bg-background' : 'bg-muted/50'
              }`}
            >
              <Switch
                checked={daySchedule.is_open}
                onCheckedChange={() => handleToggleDay(day.value)}
              />
              <Label className="w-28 font-medium text-sm">
                {day.label}
              </Label>
              
              {daySchedule.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={daySchedule.start_time}
                    onChange={(e) => handleTimeChange(day.value, 'start_time', e.target.value)}
                    className="w-24 text-center"
                  />
                  <span className="text-muted-foreground text-sm">às</span>
                  <Input
                    type="time"
                    value={daySchedule.end_time}
                    onChange={(e) => handleTimeChange(day.value, 'end_time', e.target.value)}
                    className="w-24 text-center"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Fechado</span>
              )}
            </div>
          );
        })}

        <Button 
          className="w-full mt-4" 
          onClick={handleSave}
          disabled={upsertMutation.isPending || !hasChanges}
        >
          {upsertMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {upsertMutation.isPending ? 'Salvando...' : 'Salvar Horários'}
        </Button>
      </CardContent>
    </Card>
  );
}
