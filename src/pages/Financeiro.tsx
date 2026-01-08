import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCashflowEntries, useCashflowCategories, useCreateCashflowEntry } from '@/hooks/useCashflow';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CashflowType } from '@/types/database';

export default function Financeiro() {
  const [period, setPeriod] = useState('month');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryType, setEntryType] = useState<CashflowType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const startDate = period === 'month' ? startOfMonth(new Date()) : startOfMonth(subMonths(new Date(), 2));
  const endDate = endOfMonth(new Date());

  const { data: entries = [] } = useCashflowEntries(startDate, endDate);
  const { data: categories = [] } = useCashflowCategories();
  const createEntry = useCreateCashflowEntry();

  const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const expenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = income - expenses;

  const filteredCategories = categories.filter(c => c.type === entryType);

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

  return (
    <AppLayout title="Financeiro">
      <div className="space-y-4">
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

        {/* FAB */}
        {isAdmin && (
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
