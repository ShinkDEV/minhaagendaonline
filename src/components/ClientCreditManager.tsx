import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Wallet, Plus, Minus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClientCreditMovements, useAddCreditMovement } from '@/hooks/useClientCredits';

interface ClientCreditManagerProps {
  clientId: string;
  creditBalance: number;
}

export function ClientCreditManager({ clientId, creditBalance }: ClientCreditManagerProps) {
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [movementType, setMovementType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: movements = [], isLoading } = useClientCreditMovements(clientId);
  const addMovement = useAddCreditMovement();

  const handleSubmit = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;

    await addMovement.mutateAsync({
      client_id: clientId,
      amount: value,
      type: movementType,
      description: description || undefined,
    });

    setShowAddMovement(false);
    setAmount('');
    setDescription('');
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Créditos / Débitos
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddMovement(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Lançar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-4 p-3 rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground">Saldo Atual</div>
            <div className={cn(
              "text-2xl font-bold",
              creditBalance >= 0 ? "text-green-600" : "text-destructive"
            )}>
              R$ {creditBalance.toFixed(2)}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum lançamento registrado
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {movements.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {mov.type === 'credit' ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <div className="text-sm">
                        {mov.description || (mov.type === 'credit' ? 'Crédito' : 'Débito')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(mov.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <Badge variant={mov.type === 'credit' ? 'default' : 'destructive'}>
                    {mov.type === 'credit' ? '+' : '-'} R$ {mov.amount.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={showAddMovement} onOpenChange={setShowAddMovement}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Lançar Crédito/Débito</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <Tabs value={movementType} onValueChange={(v) => setMovementType(v as 'credit' | 'debit')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="credit" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crédito
                </TabsTrigger>
                <TabsTrigger value="debit" className="gap-2">
                  <Minus className="h-4 w-4" />
                  Débito
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Motivo do lançamento..."
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={addMovement.isPending || !amount}
            >
              {addMovement.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
