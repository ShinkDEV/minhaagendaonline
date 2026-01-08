import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Phone, Mail, Calendar, DollarSign, TrendingUp, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClient } from '@/hooks/useClients';
import { useClientHistory, useClientStats } from '@/hooks/useClientHistory';

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

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: client, isLoading: loadingClient } = useClient(id);
  const { data: history = [], isLoading: loadingHistory } = useClientHistory(id);
  const { stats } = useClientStats(id);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Detalhes do Cliente</h1>
        </div>

        {/* Client Info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {getInitials(client.full_name)}
                </AvatarFallback>
              </Avatar>
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
          </CardContent>
        </Card>

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
      </div>
    </AppLayout>
  );
}
