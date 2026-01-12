import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientAvatarUpload } from '@/components/ClientAvatarUpload';
import { ClientCreditManager } from '@/components/ClientCreditManager';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Phone, Mail, Calendar, DollarSign, TrendingUp, Clock, Star, Edit, User, CreditCard } from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClient, useUpdateClient } from '@/hooks/useClients';
import { useClientHistory, useClientStats } from '@/hooks/useClientHistory';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-primary',
  completed: 'bg-green-500',
  cancelled: 'bg-muted',
};

const genderLabels: Record<string, string> = {
  female: 'Feminino',
  male: 'Masculino',
  other: 'Outro',
  prefer_not_say: 'Prefiro não dizer',
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: client, isLoading: loadingClient } = useClient(id);
  const { data: history = [], isLoading: loadingHistory } = useClientHistory(id);
  const { stats } = useClientStats(id);
  const updateClient = useUpdateClient();

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: '',
    cpf: '',
    rg: '',
    notes: '',
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCpfDisplay = (cpf: string | null) => {
    if (!cpf) return null;
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  const handleOpenEdit = () => {
    if (!client) return;
    setEditForm({
      full_name: client.full_name,
      phone: client.phone || '',
      email: client.email || '',
      birth_date: client.birth_date || '',
      gender: client.gender || '',
      cpf: client.cpf ? formatCpfDisplay(client.cpf) || '' : '',
      rg: client.rg || '',
      notes: client.notes || '',
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      await updateClient.mutateAsync({
        id,
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        email: editForm.email || null,
        birth_date: editForm.birth_date || null,
        gender: editForm.gender || null,
        cpf: editForm.cpf.replace(/\D/g, '') || null,
        rg: editForm.rg || null,
        notes: editForm.notes || null,
      });
      setShowEdit(false);
      toast({ title: 'Cliente atualizado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  if (loadingClient) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button variant="link" onClick={() => navigate('/clients')}>
            Voltar para clientes
          </Button>
        </div>
      </AppLayout>
    );
  }

  const age = getAge(client.birth_date);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Detalhes do Cliente</h1>
          </div>
          <Button variant="outline" size="icon" onClick={handleOpenEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* Client Info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <ClientAvatarUpload
                clientId={client.id}
                clientName={client.full_name}
                avatarUrl={client.avatar_url}
                size="lg"
                editable
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{client.full_name}</h2>
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {(client.birth_date || client.gender || client.cpf || client.rg) && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {client.birth_date && (
                    <div>
                      <span className="text-muted-foreground">Nascimento:</span>
                      <span className="ml-2">
                        {format(parseISO(client.birth_date), "dd/MM/yyyy")}
                        {age && <span className="text-muted-foreground ml-1">({age} anos)</span>}
                      </span>
                    </div>
                  )}
                  {client.gender && (
                    <div>
                      <span className="text-muted-foreground">Gênero:</span>
                      <span className="ml-2">{genderLabels[client.gender] || client.gender}</span>
                    </div>
                  )}
                  {client.cpf && (
                    <div>
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="ml-2">{formatCpfDisplay(client.cpf)}</span>
                    </div>
                  )}
                  {client.rg && (
                    <div>
                      <span className="text-muted-foreground">RG:</span>
                      <span className="ml-2">{client.rg}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credit Manager */}
        <ClientCreditManager clientId={client.id} creditBalance={client.credit_balance ?? 0} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total Gasto</span>
              </div>
              <div className="text-xl font-bold text-primary">
                R$ {stats.totalSpent.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Atendimentos</span>
              </div>
              <div className="text-xl font-bold">
                {stats.completedCount}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {stats.appointmentCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Visit */}
        {stats.lastVisit && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Última Visita</span>
              </div>
              <div className="font-medium">
                {format(new Date(stats.lastVisit), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Services */}
        {stats.topServices.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Serviços Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stats.topServices.map((service, idx) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="text-sm">{service.name}</span>
                    </div>
                    <Badge variant="secondary">{service.count}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment History */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Histórico de Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingHistory ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum atendimento registrado
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/appointments/${apt.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          statusColors[apt.status]
                        )} />
                        <span className="text-sm font-medium">
                          {format(new Date(apt.start_at), "dd/MM/yyyy 'às' HH:mm")}
                        </span>
                      </div>
                      <Badge variant={apt.status === 'completed' ? 'default' : apt.status === 'cancelled' ? 'secondary' : 'outline'}>
                        {statusLabels[apt.status]}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-1">
                      {apt.professional?.display_name}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {apt.appointment_services?.map((as, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {as.service?.name}
                        </Badge>
                      ))}
                    </div>
                    
                    {apt.status === 'completed' && apt.total_amount > 0 && (
                      <div className="text-sm font-semibold text-primary">
                        R$ {Number(apt.total_amount).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {client.notes && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {client.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Sheet */}
        <Sheet open={showEdit} onOpenChange={setShowEdit}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Editar Cliente</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select 
                    value={editForm.gender} 
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, gender: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                      <SelectItem value="prefer_not_say">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={editForm.cpf}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cpf: formatCpf(e.target.value) }))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input
                    value={editForm.rg}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rg: e.target.value }))}
                    placeholder="00.000.000-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observações sobre o cliente..."
                  rows={3}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSaveEdit}
                disabled={updateClient.isPending}
              >
                {updateClient.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
