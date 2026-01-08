import { useState } from 'react';
import { format, setHours, setMinutes, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Trash2, Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useTimeBlocks, useCreateTimeBlock, useDeleteTimeBlock, TimeBlock } from '@/hooks/useTimeBlocks';

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

export function TimeBlockManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  
  // Form state
  const [professionalId, setProfessionalId] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly'>('daily');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();

  const { data: professionals = [] } = useProfessionals();
  const { data: blocks = [] } = useTimeBlocks(
    selectedProfessional !== 'all' ? selectedProfessional : undefined
  );
  const createBlock = useCreateTimeBlock();
  const deleteBlock = useDeleteTimeBlock();

  const resetForm = () => {
    setProfessionalId('');
    setTitle('');
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime('12:00');
    setEndTime('13:00');
    setIsRecurring(false);
    setRecurrenceType('daily');
    setRecurrenceDays([1, 2, 3, 4, 5]);
    setRecurrenceEndDate(undefined);
  };

  const handleSubmit = async () => {
    if (!professionalId) {
      toast({ variant: 'destructive', title: 'Selecione um profissional' });
      return;
    }
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Digite um título' });
      return;
    }

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let start_at: Date;
    let end_at: Date;

    if (isRecurring) {
      // For recurring, use just the time with today's date as reference
      start_at = setMinutes(setHours(new Date(), startH), startM);
      end_at = setMinutes(setHours(new Date(), endH), endM);
    } else {
      // For one-time, use the full date range
      start_at = setMinutes(setHours(startDate, startH), startM);
      end_at = setMinutes(setHours(endDate, endH), endM);
    }

    try {
      await createBlock.mutateAsync({
        professional_id: professionalId,
        title: title.trim(),
        start_at: start_at.toISOString(),
        end_at: end_at.toISOString(),
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        recurrence_days: isRecurring && recurrenceType === 'weekly' ? recurrenceDays : null,
        recurrence_end_date: isRecurring && recurrenceEndDate 
          ? format(recurrenceEndDate, 'yyyy-MM-dd') 
          : null,
      });
      
      toast({ title: 'Bloqueio criado!' });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBlock.mutateAsync(id);
      toast({ title: 'Bloqueio removido!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const toggleWeekday = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const getProfessionalName = (id: string) => {
    return professionals.find(p => p.id === id)?.display_name || 'Desconhecido';
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Bloqueio de Horários</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Novo Bloqueio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Bloqueio de Horário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Professional */}
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select value={professionalId} onValueChange={setProfessionalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Almoço, Férias, Folga..."
                />
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(!!checked)}
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Bloqueio recorrente
                </Label>
              </div>

              {isRecurring ? (
                <>
                  {/* Recurrence Type */}
                  <div className="space-y-2">
                    <Label>Tipo de recorrência</Label>
                    <Select value={recurrenceType} onValueChange={(v: 'daily' | 'weekly') => setRecurrenceType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weekdays (for weekly) */}
                  {recurrenceType === 'weekly' && (
                    <div className="space-y-2">
                      <Label>Dias da semana</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => (
                          <Button
                            key={day.value}
                            type="button"
                            variant={recurrenceDays.includes(day.value) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleWeekday(day.value)}
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hora início</Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora fim</Label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recurrence End Date */}
                  <div className="space-y-2">
                    <Label>Data de término (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate 
                            ? format(recurrenceEndDate, 'dd/MM/yyyy') 
                            : 'Sem data de término'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              ) : (
                <>
                  {/* Date Range for one-time blocks */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(startDate, 'dd/MM/yy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(d) => d && setStartDate(d)}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Data fim</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(endDate, 'dd/MM/yy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(d) => d && setEndDate(d)}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hora início</Label>
                      <Select value={startTime} onValueChange={setStartTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora fim</Label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={createBlock.isPending}
              >
                {createBlock.isPending ? 'Criando...' : 'Criar Bloqueio'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filter */}
        <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por profissional" />
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

        {/* Blocks List */}
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum bloqueio cadastrado
          </p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{block.title}</span>
                    {block.is_recurring && (
                      <Badge variant="secondary" className="text-xs">
                        <Repeat className="h-3 w-3 mr-1" />
                        {block.recurrence_type === 'daily' ? 'Diário' : 'Semanal'}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getProfessionalName(block.professional_id)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {block.is_recurring ? (
                      <>
                        {format(new Date(block.start_at), 'HH:mm')} - {format(new Date(block.end_at), 'HH:mm')}
                        {block.recurrence_type === 'weekly' && block.recurrence_days && (
                          <span className="ml-2">
                            ({block.recurrence_days.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(', ')})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {format(new Date(block.start_at), 'dd/MM/yy HH:mm')} - {format(new Date(block.end_at), 'dd/MM/yy HH:mm')}
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(block.id)}
                  disabled={deleteBlock.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
