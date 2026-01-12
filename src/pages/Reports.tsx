import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfessionals } from '@/hooks/useProfessionals';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, Users, Scissors, DollarSign, Calendar, Percent, UserPlus, Receipt, UserCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PeriodOption = 'this_month' | 'last_month' | 'last_3_months';

export default function Reports() {
  const { salon } = useAuth();
  const [period, setPeriod] = useState<PeriodOption>('this_month');
  const { data: professionals } = useProfessionals();

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last_3_months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period]);

  // Fetch completed appointments with services and client info
  const { data: appointments } = useQuery({
    queryKey: ['report-appointments', salon?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(id, display_name),
          client:clients(id, full_name, birth_date, gender, created_at),
          appointment_services(
            price_charged,
            service:services(id, name)
          )
        `)
        .eq('salon_id', salon.id)
        .gte('start_at', dateRange.start.toISOString())
        .lte('start_at', dateRange.end.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!salon?.id,
  });

  // Fetch new clients in period
  const { data: newClients } = useQuery({
    queryKey: ['report-new-clients', salon?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, full_name, birth_date, gender, created_at')
        .eq('salon_id', salon.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!salon?.id,
  });

  // Fetch all clients for demographics
  const { data: allClients } = useQuery({
    queryKey: ['report-all-clients', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, birth_date, gender')
        .eq('salon_id', salon.id);

      if (error) throw error;
      return data;
    },
    enabled: !!salon?.id,
  });

  // Fetch commissions
  const { data: commissions } = useQuery({
    queryKey: ['report-commissions', salon?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!salon?.id) return [];
      const { data, error } = await supabase
        .from('commissions')
        .select('*, professional:professionals(id, display_name)')
        .eq('salon_id', salon.id)
        .gte('calculated_at', dateRange.start.toISOString())
        .lte('calculated_at', dateRange.end.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!salon?.id,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!appointments) return null;

    const completed = appointments.filter(a => a.status === 'completed');
    const cancelled = appointments.filter(a => a.status === 'cancelled');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.total_amount || 0), 0);
    const totalAppointments = appointments.length;
    const completedCount = completed.length;
    const cancelledCount = cancelled.length;
    const cancellationRate = totalAppointments > 0 
      ? ((cancelledCount / totalAppointments) * 100).toFixed(1) 
      : '0';
    const averageTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

    // Unique clients served
    const uniqueClientsServed = new Set(
      completed.filter(a => a.client_id).map(a => a.client_id)
    ).size;

    return {
      totalRevenue,
      totalAppointments,
      completedCount,
      cancelledCount,
      cancellationRate,
      averageTicket,
      uniqueClientsServed,
      newClientsCount: newClients?.length || 0,
    };
  }, [appointments, newClients]);

  // Age distribution
  const ageDistribution = useMemo(() => {
    if (!allClients) return [];

    const ranges = [
      { label: '0-17', min: 0, max: 17, count: 0 },
      { label: '18-25', min: 18, max: 25, count: 0 },
      { label: '26-35', min: 26, max: 35, count: 0 },
      { label: '36-45', min: 36, max: 45, count: 0 },
      { label: '46-55', min: 46, max: 55, count: 0 },
      { label: '56+', min: 56, max: 150, count: 0 },
    ];

    let withBirthDate = 0;
    allClients.forEach(client => {
      if (client.birth_date) {
        withBirthDate++;
        const age = differenceInYears(new Date(), parseISO(client.birth_date));
        const range = ranges.find(r => age >= r.min && age <= r.max);
        if (range) range.count++;
      }
    });

    return withBirthDate > 0 ? ranges.filter(r => r.count > 0) : [];
  }, [allClients]);

  // Gender distribution
  const genderDistribution = useMemo(() => {
    if (!allClients) return [];

    const genderMap: Record<string, { name: string; count: number; color: string }> = {
      female: { name: 'Feminino', count: 0, color: 'hsl(330, 70%, 60%)' },
      male: { name: 'Masculino', count: 0, color: 'hsl(210, 70%, 60%)' },
      other: { name: 'Outro', count: 0, color: 'hsl(45, 70%, 60%)' },
      not_informed: { name: 'Não informado', count: 0, color: 'hsl(0, 0%, 60%)' },
    };

    allClients.forEach(client => {
      const gender = client.gender || 'not_informed';
      if (genderMap[gender]) {
        genderMap[gender].count++;
      } else {
        genderMap['not_informed'].count++;
      }
    });

    return Object.values(genderMap).filter(g => g.count > 0);
  }, [allClients]);

  // Revenue by professional
  const revenueByProfessional = useMemo(() => {
    if (!appointments || !professionals) return [];

    const profMap = new Map<string, { name: string; revenue: number; count: number }>();
    
    professionals.forEach(p => {
      profMap.set(p.id, { name: p.display_name, revenue: 0, count: 0 });
    });

    appointments.filter(a => a.status === 'completed').forEach(a => {
      const prof = profMap.get(a.professional_id);
      if (prof) {
        prof.revenue += a.total_amount || 0;
        prof.count += 1;
      }
    });

    return Array.from(profMap.values())
      .filter(p => p.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [appointments, professionals]);

  // Most sold services
  const topServices = useMemo(() => {
    if (!appointments) return [];

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();

    appointments.filter(a => a.status === 'completed').forEach(a => {
      (a.appointment_services as any[])?.forEach(as => {
        const serviceName = as.service?.name || 'Serviço';
        const serviceId = as.service?.id || 'unknown';
        const existing = serviceMap.get(serviceId);
        if (existing) {
          existing.count += 1;
          existing.revenue += as.price_charged || 0;
        } else {
          serviceMap.set(serviceId, {
            name: serviceName,
            count: 1,
            revenue: as.price_charged || 0,
          });
        }
      });
    });

    return Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [appointments]);

  // Commissions summary
  const commissionsSummary = useMemo(() => {
    if (!commissions) return { pending: 0, paid: 0, total: 0, byProfessional: [] };

    const pending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const paid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);

    const profMap = new Map<string, { name: string; pending: number; paid: number }>();
    
    commissions.forEach(c => {
      const profName = (c.professional as any)?.display_name || 'Profissional';
      const profId = c.professional_id;
      const existing = profMap.get(profId);
      
      if (existing) {
        if (c.status === 'pending') existing.pending += c.amount;
        else existing.paid += c.amount;
      } else {
        profMap.set(profId, {
          name: profName,
          pending: c.status === 'pending' ? c.amount : 0,
          paid: c.status === 'paid' ? c.amount : 0,
        });
      }
    });

    return {
      pending,
      paid,
      total: pending + paid,
      byProfessional: Array.from(profMap.values()),
    };
  }, [commissions]);

  // Occupancy rate (simplified: completed appointments / working hours)
  const occupancyRate = useMemo(() => {
    if (!appointments || !professionals) return 0;
    
    // Simplified calculation: assume 8 hours/day, 6 days/week per professional
    const daysInPeriod = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const workDays = Math.ceil(daysInPeriod * (6/7)); // ~6 working days per week
    const totalSlots = (professionals.length || 1) * workDays * 8; // 8 slots per day
    const completedCount = appointments.filter(a => a.status === 'completed').length;
    
    return Math.min(100, Math.round((completedCount / totalSlots) * 100));
  }, [appointments, professionals, dateRange]);

  const chartConfig = {
    revenue: { label: 'Receita', color: 'hsl(256, 75%, 56%)' },
    count: { label: 'Quantidade', color: 'hsl(256, 75%, 70%)' },
    pending: { label: 'Pendente', color: 'hsl(45, 93%, 47%)' },
    paid: { label: 'Pago', color: 'hsl(142, 71%, 45%)' },
  };

  const COLORS = ['hsl(256, 75%, 56%)', 'hsl(256, 75%, 70%)', 'hsl(256, 75%, 45%)', 'hsl(256, 75%, 80%)'];

  return (
    <AppLayout title="Relatórios">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-24">
        {/* Period Filter */}
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-semibold truncate">Análise do Período</h2>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
            <SelectTrigger className="w-32 sm:w-40 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Este mês</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">Receita Total</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-primary truncate">
                R$ {metrics?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">Ticket Médio</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-primary truncate">
                R$ {metrics?.averageTicket.toFixed(2) || '0,00'}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">Atendimentos</span>
              </div>
              <p className="text-lg sm:text-xl font-bold">{metrics?.completedCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                de {metrics?.totalAppointments || 0} agendados
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">Clientes</span>
              </div>
              <p className="text-lg sm:text-xl font-bold">{metrics?.uniqueClientsServed || 0}</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">Novos</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-600">{metrics?.newClientsCount || 0}</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">Ocupação</span>
              </div>
              <p className="text-lg sm:text-xl font-bold">{occupancyRate}%</p>
            </CardContent>
          </Card>

          <Card className="col-span-2 overflow-hidden">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs truncate">Cancelamentos</span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-destructive">
                  {metrics?.cancellationRate || 0}%
                </p>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground text-right whitespace-nowrap">
                {metrics?.cancelledCount || 0}/{metrics?.totalAppointments || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="professionals" className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="professionals" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
              <span className="hidden sm:inline">Profissionais</span>
              <span className="sm:hidden">Prof.</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
              <span className="hidden sm:inline">Serviços</span>
              <span className="sm:hidden">Serv.</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="commissions" className="text-[10px] sm:text-sm px-1 sm:px-3 py-1.5 sm:py-2">
              <span className="hidden sm:inline">Comissões</span>
              <span className="sm:hidden">Com.</span>
            </TabsTrigger>
          </TabsList>

          {/* Revenue by Professional */}
          <TabsContent value="professionals" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Receita por Profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {revenueByProfessional.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-48 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByProfessional} layout="vertical" margin={{ left: -10, right: 10 }}>
                        <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 10 }} tickFormatter={(v) => v.length > 8 ? v.substring(0, 8) + '...' : v} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} name="Receita" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Professional Details */}
            <div className="space-y-2">
              {revenueByProfessional.map((prof, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{prof.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {prof.count} atend.
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary text-sm sm:text-base">
                        R$ {prof.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Média: R$ {(prof.revenue / prof.count).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Top Services */}
          <TabsContent value="services" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Serviços Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {topServices.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-48 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topServices}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {topServices.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Service Details */}
            <div className="space-y-2">
              {topServices.map((service, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="secondary" className="text-sm sm:text-lg font-bold w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full flex-shrink-0">
                        {idx + 1}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{service.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {service.count} venda{service.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-sm sm:text-base flex-shrink-0">R$ {service.revenue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Clients Demographics */}
          <TabsContent value="clients" className="space-y-3 sm:space-y-4">
            {/* Age Distribution */}
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Faixa Etária dos Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {ageDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-40 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageDistribution} margin={{ left: -20 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} name="Clientes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-xs sm:text-sm">
                    Nenhum cliente com data de nascimento cadastrada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Age Range Details */}
            {ageDistribution.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                {ageDistribution.map((range, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-2 sm:p-3 text-center">
                      <p className="text-base sm:text-lg font-bold">{range.count}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{range.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Gender Distribution */}
            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Clientes por Gênero
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {genderDistribution.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-40 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genderDistribution}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={50}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {genderDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-xs sm:text-sm">
                    Nenhum cliente cadastrado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Gender Details */}
            {genderDistribution.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {genderDistribution.map((gender, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: gender.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-base truncate">{gender.name}</p>
                        <p className="text-[10px] sm:text-sm text-muted-foreground">
                          {gender.count} ({allClients && allClients.length > 0 
                            ? ((gender.count / allClients.length) * 100).toFixed(0) 
                            : 0}%)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-3 text-center divide-x">
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">{allClients?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{newClients?.length || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Novos</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold">{metrics?.uniqueClientsServed || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Atendidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 mb-1">Pendente</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400">
                    R$ {commissionsSummary.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-400 mb-1">Pago</p>
                  <p className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400">
                    R$ {commissionsSummary.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base">Comissões por Profissional</CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {commissionsSummary.byProfessional.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-40 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={commissionsSummary.byProfessional} margin={{ left: -20 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickFormatter={(v) => v.length > 6 ? v.substring(0, 6) + '..' : v} />
                        <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="paid" stackId="a" fill="hsl(142, 71%, 45%)" name="Pago" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="pending" stackId="a" fill="hsl(45, 93%, 47%)" name="Pendente" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-xs sm:text-sm">
                    Nenhuma comissão registrada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Commission Details by Professional */}
            <div className="space-y-2">
              {commissionsSummary.byProfessional.map((prof, idx) => (
                <Card key={idx}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1 sm:mb-2 gap-2">
                      <p className="font-medium text-sm sm:text-base truncate">{prof.name}</p>
                      <p className="font-bold text-sm sm:text-base flex-shrink-0">
                        R$ {(prof.pending + prof.paid).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                      <span className="text-green-600 dark:text-green-400">
                        Pago: R$ {prof.paid.toFixed(2)}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        Pend: R$ {prof.pending.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
