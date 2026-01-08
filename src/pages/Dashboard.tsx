import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, Clock, Plus, TrendingUp, AlertCircle, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '@/hooks/useAppointments';
import { useCommissions } from '@/hooks/useCommissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnnouncementBanner } from '@/components/announcements/AnnouncementBanner';

export default function Dashboard() {
  const { profile, salon, salonPlan, isAdmin, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  
  // Get professional ID for current user (for filtering)
  const { data: myProfessional } = useQuery({
    queryKey: ['my-professional', user?.id, salon?.id],
    queryFn: async () => {
      if (!user?.id || !salon?.id) return null;
      const { data } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('profile_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!salon?.id && !isAdmin,
  });

  const { data: todayAppointments = [] } = useAppointments(today);
  const { data: pendingCommissions = [] } = useCommissions('pending');

  // Filter appointments for professional view
  const filteredAppointments = isAdmin 
    ? todayAppointments 
    : todayAppointments.filter(a => a.professional_id === myProfessional?.id);

  // Filter commissions for professional view
  const filteredCommissions = isAdmin 
    ? pendingCommissions 
    : pendingCommissions.filter(c => c.professional_id === myProfessional?.id);

  const confirmedToday = filteredAppointments.filter(a => a.status === 'confirmed');
  const completedToday = filteredAppointments.filter(a => a.status === 'completed');
  const revenueToday = completedToday.reduce((sum, a) => sum + Number(a.total_amount), 0);
  const pendingCommissionTotal = filteredCommissions.reduce((sum, c) => sum + Number(c.amount), 0);

  // Different stats for admin vs professional
  const adminStats = [
    { 
      label: 'Hoje', 
      value: confirmedToday.length.toString(), 
      sublabel: 'agendamentos', 
      icon: Calendar, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Receita', 
      value: `R$ ${revenueToday.toFixed(0)}`, 
      sublabel: 'do dia', 
      icon: DollarSign, 
      color: 'bg-green-500/10 text-green-600' 
    },
    { 
      label: 'Comissões', 
      value: `R$ ${pendingCommissionTotal.toFixed(0)}`, 
      sublabel: 'pendentes', 
      icon: TrendingUp, 
      color: 'bg-orange-500/10 text-orange-600' 
    },
    { 
      label: 'Concluídos', 
      value: completedToday.length.toString(), 
      sublabel: 'hoje', 
      icon: Clock, 
      color: 'bg-blue-500/10 text-blue-600' 
    },
  ];

  const professionalStats = [
    { 
      label: 'Meus Atendimentos', 
      value: confirmedToday.length.toString(), 
      sublabel: 'hoje', 
      icon: Calendar, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Minhas Comissões', 
      value: `R$ ${pendingCommissionTotal.toFixed(0)}`, 
      sublabel: 'a receber', 
      icon: TrendingUp, 
      color: 'bg-orange-500/10 text-orange-600' 
    },
    { 
      label: 'Concluídos', 
      value: completedToday.length.toString(), 
      sublabel: 'hoje', 
      icon: Clock, 
      color: 'bg-green-500/10 text-green-600' 
    },
  ];

  const stats = isAdmin ? adminStats : professionalStats;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Announcements */}
        <AnnouncementBanner />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">{salon?.name}</p>
        </div>

        {/* Plan info - only for admins */}
        {isAdmin && salonPlan && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Plano: {salonPlan.plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Até {salonPlan.plan.max_professionals} profissionais
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/plans')}>
                Ver planos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions - only for admins */}
        {isAdmin && (
          <div className="flex gap-3">
            <Button className="flex-1 h-12" onClick={() => navigate('/appointments/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button variant="outline" className="flex-1 h-12" onClick={() => navigate('/clients')}>
              <Users className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        )}

        {/* Today's Appointments */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">
                {isAdmin ? 'Próximos Atendimentos' : 'Meus Atendimentos de Hoje'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')}>
                Ver agenda
              </Button>
            </div>
            
            {confirmedToday.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum agendamento para hoje
              </p>
            ) : (
              <div className="divide-y divide-border -mx-4">
                {confirmedToday.slice(0, 5).map((apt) => (
                  <div 
                    key={apt.id} 
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/appointments/${apt.id}`)}
                  >
                    <div className="text-center min-w-[50px]">
                      <div className="text-sm font-semibold text-foreground">
                        {format(new Date(apt.start_at), 'HH:mm')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {apt.client?.full_name || 'Cliente não informado'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {apt.appointment_services?.map(s => s.service?.name).join(', ')}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        {apt.professional?.display_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
