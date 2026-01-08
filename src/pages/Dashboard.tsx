import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, DollarSign, Clock, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const stats = [
  { label: 'Hoje', value: '8', sublabel: 'agendamentos', icon: Calendar, color: 'bg-primary/10 text-primary' },
  { label: 'Semana', value: 'R$ 2.450', sublabel: 'faturamento', icon: DollarSign, color: 'bg-green-500/10 text-green-600' },
  { label: 'Clientes', value: '156', sublabel: 'cadastrados', icon: Users, color: 'bg-blue-500/10 text-blue-600' },
  { label: 'Média', value: '45min', sublabel: 'atendimento', icon: Clock, color: 'bg-orange-500/10 text-orange-600' },
];

const upcomingAppointments = [
  { time: '09:00', client: 'Maria Silva', service: 'Corte + Escova', professional: 'Ana' },
  { time: '10:30', client: 'João Santos', service: 'Corte Masculino', professional: 'Carlos' },
  { time: '11:00', client: 'Paula Costa', service: 'Manicure', professional: 'Bruna' },
  { time: '14:00', client: 'Fernanda Lima', service: 'Coloração', professional: 'Ana' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Olá! 👋</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
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

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button 
            className="flex-1 h-12"
            onClick={() => navigate('/agenda')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-12"
            onClick={() => navigate('/clientes')}
          >
            <Users className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Próximos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {upcomingAppointments.map((apt, index) => (
                <div key={index} className="flex items-center gap-4 px-4 py-3">
                  <div className="text-center min-w-[50px]">
                    <div className="text-sm font-semibold text-foreground">{apt.time}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{apt.client}</div>
                    <div className="text-sm text-muted-foreground truncate">{apt.service}</div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {apt.professional}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
