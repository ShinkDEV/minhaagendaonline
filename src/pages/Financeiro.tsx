import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft, 
  DollarSign, Calendar, User, CheckCircle, Users, ChevronLeft, 
  ChevronRight, FileText, CreditCard, Percent, Wallet
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCashflowEntries, useCashflowCategories, useCreateCashflowEntry } from '@/hooks/useCashflow';
import { useProfessionals } from '@/hooks/useProfessionals';
import { useCommissions, usePayCommission } from '@/hooks/useCommissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CashflowType, Commission } from '@/types/database';
import { CommissionReceipt } from '@/components/CommissionReceipt';

type PeriodFilter = 'full' | 'first' | 'second';

export default function Financeiro() {
  const [mainTab, setMainTab] = useState('cashflow');
  const [period, setPeriod] = useState('month');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryType, setEntryType] = useState<CashflowType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Commissions state
  const [commissionTab, setCommissionTab] = useState('pending');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('full');
  const [confirmPayDialog, setConfirmPayDialog] = useState<Commission | null>(null);
  const [receiptCommission, setReceiptCommission] = useState<Commission | null>(null);
  
  const { isAdmin, salon } = useAuth();
  const { toast } = useToast();

  // Cashflow data
  const cashflowStartDate = period === 'month' ? startOfMonth(new Date()) : startOfMonth(subMonths(new Date(), 2));
  const cashflowEndDate = endOfMonth(new Date());

  const { data: entries = [] } = useCashflowEntries(cashflowStartDate, cashflowEndDate);
  const { data: categories = [] } = useCashflowCategories();
  const createEntry = useCreateCashflowEntry();

  // Commissions data
  const { data: professionals = [] } = useProfessionals();
  const { data: commissions = [], isLoading: commissionsLoading } = useCommissions();
  const payCommission = usePayCommission();

  const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const expenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = income - expenses;

  const filteredCategories = categories.filter(c => c.type === entryType);

  // Commission date range
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

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const matchesProfessional = selectedProfessional === 'all' || c.professional_id === selectedProfessional;
      const matchesStatus = c.status === commissionTab;
      const appointmentDate = c.appointment?.start_at ? new Date(c.appointment.start_at) : null;
      const matchesDate = appointmentDate 
        ? isWithinInterval(appointmentDate, { start: dateRange.start, end: dateRange.end })
        : false;
      return matchesProfessional && matchesDate && matchesStatus;
    });
  }, [commissions, selectedProfessional, dateRange, commissionTab]);

  const commissionsInDateRange = useMemo(() => {
    return commissions.filter(c => {
      const matchesProfessional = selectedProfessional === 'all' || c.professional_id === selectedProfessional;
      const appointmentDate = c.appointment?.start_at ? new Date(c.appointment.start_at) : null;
      const matchesDate = appointmentDate 
        ? isWithinInterval(appointmentDate, { start: dateRange.start, end: dateRange.end })
        : false;
      return matchesProfessional && matchesDate;
    });
  }, [commissions, selectedProfessional, dateRange]);

  const professionalSummary = useMemo(() => {
    return professionals.filter(p => p.active).map(prof => {
      const profCommissions = commissionsInDateRange.filter(c => c.professional_id === prof.id);
      const pending = profCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
      const paid = profCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);
      return { ...prof, pending, paid, total: pending + paid };
    }).sort((a, b) => b.pending - a.pending);
  }, [professionals, commissionsInDateRange]);

  const totalPending = commissionsInDateRange.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);
  const totalPaid = commissionsInDateRange.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0);

  const handleCreateEntry = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast({ variant: 'destructive', title: 'Valor inválido' });
      return;
    }

    try {
      await createEntry.mutateAsync({
        type: entryType,
        category_id: categoryId || undefined,
        amount: parseFloat(amount),
        description: description || undefined,
      });
      setShowNewEntry(false);
      setAmount('');
      setDescription('');
      setCategoryId('');
      toast({ title: 'Lançamento criado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

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
    <AppLayout title="Financeiro">
      <div className="space-y-4">
        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cashflow" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Caixa
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Comissões
            </TabsTrigger>
          </TabsList>

          {/* Cashflow Tab */}
          <TabsContent value="cashflow" className="space-y-4 mt-4">
            {/* Period selector */}
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="month">Este mês</TabsTrigger>
                <TabsTrigger value="quarter">Últimos 3 meses</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Receitas</span>
                  </div>
                  <div className="text-2xl font-bold">R$ {income.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm">Despesas</span>
                  </div>
                  <div className="text-2xl font-bold">R$ {expenses.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Balance */}
            <Card className={`border-0 shadow-sm ${balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-1">Saldo do período</div>
                <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            {/* Entries List */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lançamentos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum lançamento no período
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {entries.slice(0, 20).map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          entry.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {entry.type === 'income' ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownLeft className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {entry.description || entry.category?.name || (entry.type === 'income' ? 'Receita' : 'Despesa')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(entry.occurred_at), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <div className={`font-semibold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.type === 'income' ? '+' : '-'} R$ {Number(entry.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions" className="space-y-4 mt-4">
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

            {/* Commission Status Tabs */}
            <Tabs value={commissionTab} onValueChange={setCommissionTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="paid">Pagas</TabsTrigger>
              </TabsList>

              <TabsContent value={commissionTab} className="mt-4">
                {commissionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : filteredCommissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma comissão {commissionTab === 'pending' ? 'pendente' : 'paga'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCommissions.map((commission) => {
                      const hasDeductions = (commission.card_fee_amount || 0) > 0 || (commission.admin_fee_amount || 0) > 0;
                      
                      return (
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
                                
                                {/* Fee deductions */}
                                {hasDeductions && (
                                  <div className="flex items-center gap-2 mt-1 text-xs">
                                    {(commission.card_fee_amount || 0) > 0 && (
                                      <span className="flex items-center gap-1 text-destructive">
                                        <CreditCard className="h-3 w-3" />
                                        -R$ {Number(commission.card_fee_amount).toFixed(2)}
                                      </span>
                                    )}
                                    {(commission.admin_fee_amount || 0) > 0 && (
                                      <span className="flex items-center gap-1 text-destructive">
                                        <Percent className="h-3 w-3" />
                                        -R$ {Number(commission.admin_fee_amount).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right space-y-2">
                                {hasDeductions && commission.gross_amount && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    R$ {Number(commission.gross_amount).toFixed(2)}
                                  </p>
                                )}
                                <p className="text-lg font-bold text-primary">
                                  R$ {Number(commission.amount).toFixed(2)}
                                </p>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setReceiptCommission(commission)}
                                    title="Ver recibo"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
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
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* New Entry Sheet */}
        <Sheet open={showNewEntry} onOpenChange={setShowNewEntry}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Novo Lançamento</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={entryType === 'income' ? 'default' : 'outline'}
                  onClick={() => setEntryType('income')}
                  className={entryType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Receita
                </Button>
                <Button
                  variant={entryType === 'expense' ? 'default' : 'outline'}
                  onClick={() => setEntryType('expense')}
                  className={entryType === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Despesa
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do lançamento"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateEntry}
                disabled={createEntry.isPending}
              >
                {createEntry.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

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

        {/* Commission Receipt */}
        <CommissionReceipt
          commission={receiptCommission}
          salonName={salon?.name || 'Salão'}
          open={!!receiptCommission}
          onClose={() => setReceiptCommission(null)}
        />

        {/* FAB */}
        {isAdmin && mainTab === 'cashflow' && (
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowNewEntry(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
