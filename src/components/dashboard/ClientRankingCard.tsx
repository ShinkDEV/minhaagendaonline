import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Crown, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ClientWithCount {
  id: string;
  full_name: string;
  phone: string | null;
  appointment_count: number;
}

export function ClientRankingCard() {
  const { salon } = useAuth();
  const navigate = useNavigate();

  const { data: topClients = [], isLoading } = useQuery({
    queryKey: ['top-clients', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          full_name,
          phone,
          appointments!appointments_client_id_fkey(count)
        `)
        .eq('salon_id', salon.id)
        .eq('appointments.status', 'completed');

      if (error) throw error;

      // Transform and sort by appointment count
      const clientsWithCount = (data || [])
        .map(client => ({
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          appointment_count: (client.appointments as any)?.[0]?.count || 0,
        }))
        .filter(c => c.appointment_count > 0)
        .sort((a, b) => b.appointment_count - a.appointment_count)
        .slice(0, 10);

      return clientsWithCount as ClientWithCount[];
    },
    enabled: !!salon?.id,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 1:
        return 'bg-slate-300/20 text-slate-500 border-slate-300/30';
      case 2:
        return 'bg-amber-600/20 text-amber-700 border-amber-600/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" />
          Melhores Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : topClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum atendimento concluído</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topClients.map((client, index) => (
              <div
                key={client.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${getRankStyle(index)}`}>
                  {index + 1}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(client.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.full_name}</p>
                  {client.phone && (
                    <p className="text-xs text-muted-foreground truncate">{client.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{client.appointment_count}</p>
                  <p className="text-[10px] text-muted-foreground">atendimentos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}