import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Percent, Save, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CardFeesByInstallment } from '@/types/database';

const DEFAULT_INSTALLMENT_FEES: CardFeesByInstallment = {
  "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0,
  "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0
};

export function CommissionFeeSettings() {
  const { salon, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [cardFeesByInstallment, setCardFeesByInstallment] = useState<CardFeesByInstallment>(DEFAULT_INSTALLMENT_FEES);
  const [adminFeePercent, setAdminFeePercent] = useState('0');
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (salon) {
      const fees = (salon as any).card_fees_by_installment || DEFAULT_INSTALLMENT_FEES;
      setCardFeesByInstallment(fees);
      setAdminFeePercent(String((salon as any).admin_fee_percent || 0));
    }
  }, [salon]);

  const handleInstallmentFeeChange = (installment: string, value: string) => {
    setCardFeesByInstallment(prev => ({
      ...prev,
      [installment]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    if (!salon?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('salons')
        .update({
          card_fees_by_installment: cardFeesByInstallment,
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

  // Example calculation with 3x installment
  const exampleGross = 100;
  const exampleInstallment = "3";
  const cardFee = (exampleGross * (cardFeesByInstallment[exampleInstallment] || 0)) / 100;
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
        {/* Administrative Fee */}
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

        {/* Card Fees by Installment - Collapsible */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Taxas de Cartão por Parcela
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((installment) => (
                <div key={installment} className="space-y-1">
                  <Label htmlFor={`fee-${installment}`} className="text-xs">
                    {installment}x (%)
                  </Label>
                  <Input
                    id={`fee-${installment}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={cardFeesByInstallment[String(installment)] || 0}
                    onChange={(e) => handleInstallmentFeeChange(String(installment), e.target.value)}
                    className="h-9"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Configure a taxa de cartão aplicada para cada quantidade de parcelas (1x a 12x).
              A taxa será descontada automaticamente quando o pagamento for via cartão de crédito.
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Example calculation */}
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Exemplo de cálculo (pagamento em {exampleInstallment}x):</p>
          <div className="space-y-1 text-muted-foreground">
            <div className="flex justify-between">
              <span>Comissão bruta</span>
              <span>R$ {exampleGross.toFixed(2)}</span>
            </div>
            {cardFee > 0 && (
              <div className="flex justify-between text-destructive">
                <span>(-) Taxa cartão {exampleInstallment}x ({cardFeesByInstallment[exampleInstallment]}%)</span>
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
