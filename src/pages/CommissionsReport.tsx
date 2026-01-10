import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Calendar, User, CheckCircle, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useCommissions, usePayCommission } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Commission } from '@/types/database';

type PeriodFilter = 'full' | 'first' | 'second';

export default function CommissionsReport() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('pending');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('full');
  const [confirmPayDialog, setConfirmPayDialog] = useState<Commission | null>(null);

  const { data: professionals = [] } = useProfessionals();
  const { data: commissions = [], isLoading } = useCommissions(tab as 'pending' | 'paid');
  const payCommission = usePayCommission();

  // Calculate date range based on month and period filter
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    if (periodFilter === 'first') {
      return { start: monthStart, end: setDate(selectedMonth, 15) };
    } else if (periodFilter === 'second') {
      return { start: setDate(selectedMonth, 16), end: monthEnd };
    }
    return { start: monthStart, end: monthEnd };
  }, [selectedMonth, periodFilter]);

  // Filter by professional and date range
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const matchesProfessional = selectedProfessional === 'all' || c.professional_id === selectedProfessional;
      
      // Filter by date based on the appointment date
      const appointmentDate = c.appointment?.start_at ? new Date(c.appointment.start_at) : null;
      const matchesDate = appointmentDate 
        ? isWithinInterval(appointmentDate, { start: dateRange.start, end: dateRange.end })
        : false;
      
      return matchesProfessional && matchesDate;
    });
  }, [commissions, selectedProfessional, dateRange]);

  // Group by professional for summary (using filtered data)
  const professionalSummary = useMemo(() => {
    return professionals.filter(p => p.active).map(prof => {
      const profCommissions = filteredCommissions.filter(c => c.professional_id === prof.id);
      const pending = profCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
      const paid = profCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);
      return { ...prof, pending, paid, total: pending + paid };
    }).sort((a, b) => b.pending - a.pending);
  }, [professionals, filteredCommissions]);

  const totalPending = filteredCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPaid = filteredCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);

  const handlePayCommission = async (commission: Commission) => {
    try {
      await payCommission.mutateAsync(commission.id);
      setConfirmPayDialog(null);
      toast({ title: 'Comissão marcada como paga!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handlePreviousMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const getPeriodLabel = () => {
    const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
    if (periodFilter === 'first') return `1ª Quinzena de ${monthName}`;
    if (periodFilter === 'second') return `2ª Quinzena de ${monthName}`;
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  return (
    <AppLayout title="Relatório de Comissões">
      <div className="space-y-4">
        {/* Month Navigation */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <p className="font-semibold">{getPeriodLabel()}</p>
                <p className="text-xs text-muted-foreground">
                  {format(dateRange.start, 'dd/MM')} - {format(dateRange.end, 'dd/MM/yyyy')}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Period Filter */}
            <div className="flex gap-1 mt-3">
              <Button 
                variant={periodFilter === 'full' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setPeriodFilter('full')}
              >
                Mês Inteiro
              </Button>
              <Button 
                variant={periodFilter === 'first' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setPeriodFilter('first')}
              >
                1ª Quinzena
              </Button>
              <Button 
                variant={periodFilter === 'second' ? 'default' : 'outline'} 
                size="sm" 
                className="flex-1"
                onClick={() => setPeriodFilter('second')}
              >
                2ª Quinzena
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  <p className="text-xs text-muted-foreground">Pendentes</p>
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
                  <p className="text-xs text-muted-foreground">Pagas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resumo por Profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {professionalSummary.map(prof => (
              <div key={prof.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {getInitials(prof.display_name)}
                  </div>
                  <span className="font-medium text-sm">{prof.display_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {prof.pending > 0 && (
                    <span className="text-orange-600 font-medium">
                      R$ {prof.pending.toFixed(2)} pendente
                    </span>
                  )}
                  {prof.paid > 0 && (
                    <span className="text-green-600">
                      R$ {prof.paid.toFixed(2)} pago
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Filter */}
        <div className="flex gap-2">
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filtrar por profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.filter(p => p.active).map(prof => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            ) : filteredCommissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma comissão {tab === 'pending' ? 'pendente' : 'paga'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCommissions.map((commission) => (
                  <Card key={commission.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {commission.professional?.display_name}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cliente: {commission.appointment?.client?.full_name || 'Não informado'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {commission.appointment?.start_at && 
                              format(new Date(commission.appointment.start_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })
                            }
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-lg font-bold text-primary">
                            R$ {Number(commission.amount).toFixed(2)}
                          </p>
                          {commission.status === 'pending' && isAdmin ? (
                            <Button 
                              size="sm" 
                              onClick={() => setConfirmPayDialog(commission)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          ) : (
                            <Badge variant={commission.status === 'pending' ? 'secondary' : 'default'}>
                              {commission.status === 'pending' ? 'Pendente' : 'Paga'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirm Pay Dialog */}
        <Dialog open={!!confirmPayDialog} onOpenChange={() => setConfirmPayDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pagamento</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Deseja marcar esta comissão como paga?</p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Profissional</span>
                  <span className="font-medium">{confirmPayDialog?.professional?.display_name}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Valor</span>
                  <span className="font-bold text-primary">
                    R$ {Number(confirmPayDialog?.amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmPayDialog(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => confirmPayDialog && handlePayCommission(confirmPayDialog)}
                disabled={payCommission.isPending}
              >
                {payCommission.isPending ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
