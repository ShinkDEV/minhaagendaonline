import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Plus, User } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useActiveServices } from '@/hooks/useServices';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { Service } from '@/types/database';

export default function NewAppointment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [professionalId, setProfessionalId] = useState('');
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState('09:00');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);

  const { data: professionals = [] } = useProfessionals();
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useActiveServices();
  const createAppointment = useCreateAppointment();
  const createClient = useCreateClient();

  const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id));
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalAmount = selectedServiceObjects.reduce((sum, s) => sum + Number(s.price), 0);

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }).filter(t => {
    const hour = parseInt(t.split(':')[0]);
    return hour >= 8 && hour < 20;
  });

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }
    try {
      const client = await createClient.mutateAsync({
        full_name: newClientName,
        phone: newClientPhone || undefined,
      });
      setClientId(client.id);
      setShowNewClient(false);
      setNewClientName('');
      setNewClientPhone('');
      toast({ title: 'Cliente criado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleSubmit = async () => {
    if (!professionalId) {
      toast({ variant: 'destructive', title: 'Selecione um profissional' });
      return;
    }
    if (selectedServices.length === 0) {
      toast({ variant: 'destructive', title: 'Selecione ao menos um serviço' });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const startAt = setMinutes(setHours(date, hours), minutes);
    const endAt = addMinutes(startAt, totalDuration);

    try {
      await createAppointment.mutateAsync({
        professional_id: professionalId,
        client_id: clientId || undefined,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        total_amount: totalAmount,
        notes: notes || undefined,
        services: selectedServiceObjects.map(s => ({
          service_id: s.id,
          price_charged: Number(s.price),
          duration_minutes: s.duration_minutes,
        })),
      });
      toast({ title: 'Agendamento criado!' });
      navigate('/agenda');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Novo Agendamento</h1>
        </div>

        {/* Professional */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
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

            {/* Client */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cliente</Label>
                <Sheet open={showNewClient} onOpenChange={setShowNewClient}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Novo
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto">
                    <SheetHeader>
                      <SheetTitle>Novo Cliente</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome *</Label>
                        <Input
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <Button className="w-full" onClick={handleCreateClient}>
                        Criar Cliente
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário *</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Label className="mb-3 block">Serviços *</Label>
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    selectedServices.includes(service.id)
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <Checkbox
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.duration_minutes}min
                    </div>
                  </div>
                  <div className="font-semibold text-primary">
                    R$ {Number(service.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedServices.length > 0 && (
          <Card className="border-0 shadow-sm bg-primary/5">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Duração total</span>
                <span className="font-medium">{totalDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor total</span>
                <span className="font-bold text-primary text-lg">
                  R$ {totalAmount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o atendimento..."
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          className="w-full h-12" 
          onClick={handleSubmit}
          disabled={createAppointment.isPending}
        >
          {createAppointment.isPending ? 'Criando...' : 'Criar Agendamento'}
        </Button>
      </div>
    </AppLayout>
  );
}
