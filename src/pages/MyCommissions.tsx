import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MyCommissions() {
  const { user, salon } = useAuth();
  const [tab, setTab] = useState('pending');

  // Get professional ID for current user
  const { data: professional } = useQuery({
    queryKey: ['my-professional', user?.id, salon?.id],
    queryFn: async () => {
      if (!user?.id || !salon?.id) return null;
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('salon_id', salon.id)
        .eq('profile_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!salon?.id,
  });

  // Get commissions for this professional
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['my-commissions', professional?.id, tab],
    queryFn: async () => {
      if (!professional?.id) return [];
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          appointment:appointments(
            start_at,
            client:clients(full_name),
            appointment_services(
              service:services(name)
            )
          )
        `)
        .eq('professional_id', professional.id)
        .eq('status', tab)
        .order('calculated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!professional?.id,
  });

  const totalPending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPaid = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <AppLayout title="Minhas Comissões">
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">R$ {totalPending.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">A receber</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">R$ {totalPaid.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Recebido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="paid">Pagas</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma comissão {tab === 'pending' ? 'pendente' : 'paga'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <Card key={commission.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">
                            {commission.appointment?.client?.full_name || 'Cliente'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {commission.appointment?.appointment_services
                              ?.map((s: any) => s.service?.name)
                              .join(', ')}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {commission.appointment?.start_at && 
                              format(new Date(commission.appointment.start_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            R$ {Number(commission.amount).toFixed(2)}
                          </p>
                          <Badge variant={commission.status === 'pending' ? 'secondary' : 'default'}>
                            {commission.status === 'pending' ? 'Pendente' : 'Paga'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}