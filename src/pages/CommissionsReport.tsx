import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Calendar, User, CheckCircle, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useCommissions, usePayCommission } from '@/hooks/useCommissions';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Commission } from '@/types/database';

export default function CommissionsReport() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('pending');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [confirmPayDialog, setConfirmPayDialog] = useState<Commission | null>(null);

  const { data: professionals = [] } = useProfessionals();
  const { data: commissions = [], isLoading } = useCommissions(tab as 'pending' | 'paid');
  const payCommission = usePayCommission();

  // Filter by professional
  const filteredCommissions = commissions.filter(c => 
    selectedProfessional === 'all' || c.professional_id === selectedProfessional
  );

  // Group by professional for summary
  const professionalSummary = professionals.filter(p => p.active).map(prof => {
    const profCommissions = commissions.filter(c => c.professional_id === prof.id);
    const pending = profCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
    const paid = profCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);
    return { ...prof, pending, paid, total: pending + paid };
  }).sort((a, b) => b.pending - a.pending);

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);

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

  return (
    <AppLayout title="Relatório de Comissões">
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
