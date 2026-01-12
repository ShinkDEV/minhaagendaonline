import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Percent, Save, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function CommissionFeeSettings() {
  const { salon, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [cardFeePercent, setCardFeePercent] = useState('0');
  const [adminFeePercent, setAdminFeePercent] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (salon) {
      setCardFeePercent(String((salon as any).card_fee_percent || 0));
      setAdminFeePercent(String((salon as any).admin_fee_percent || 0));
    }
  }, [salon]);

  const handleSave = async () => {
    if (!salon?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('salons')
        .update({
          card_fee_percent: parseFloat(cardFeePercent) || 0,
          admin_fee_percent: parseFloat(adminFeePercent) || 0,
        })
        .eq('id', salon.id);

      if (error) throw error;
      
      await refreshProfile();
      toast({ title: 'Configurações de taxas salvas!' });
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao salvar', 
        description: error.message 
      });
    } finally {
      setSaving(false);
    }
  };

  // Example calculation
  const exampleGross = 100;
  const cardFee = (exampleGross * (parseFloat(cardFeePercent) || 0)) / 100;
  const adminFee = (exampleGross * (parseFloat(adminFeePercent) || 0)) / 100;
  const exampleNet = exampleGross - cardFee - adminFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Taxas sobre Comissões
        </CardTitle>
        <CardDescription>
          Configure os descontos aplicados automaticamente nas comissões dos profissionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="cardFee">Taxa de Cartão (%)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Descontado automaticamente quando o pagamento é feito via cartão de crédito ou débito
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cardFee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={cardFeePercent}
                onChange={(e) => setCardFeePercent(e.target.value)}
                className="pl-10"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="adminFee">Taxa Administrativa (%)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Taxa fixa descontada de todas as comissões, independente do método de pagamento
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="adminFee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={adminFeePercent}
                onChange={(e) => setAdminFeePercent(e.target.value)}
                className="pl-10"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Example calculation */}
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Exemplo de cálculo:</p>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Comissão bruta</span>
              <span>R$ {exampleGross.toFixed(2)}</span>
            </div>
            {cardFee > 0 && (
              <div className="flex justify-between text-destructive">
                <span>(-) Taxa cartão ({cardFeePercent}%)</span>
                <span>- R$ {cardFee.toFixed(2)}</span>
              </div>
            )}
            {adminFee > 0 && (
              <div className="flex justify-between text-destructive">
                <span>(-) Taxa admin ({adminFeePercent}%)</span>
                <span>- R$ {adminFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-foreground pt-1 border-t">
              <span>Comissão líquida</span>
              <span className="text-primary">R$ {exampleNet.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
