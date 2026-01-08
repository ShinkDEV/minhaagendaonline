import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Plus, Percent, DollarSign, Trash2, Scissors } from 'lucide-react';
import { useActiveServices } from '@/hooks/useServices';
import { useServiceCommissions, useUpsertServiceCommission, useDeleteServiceCommission } from '@/hooks/useServiceCommissions';
import { useToast } from '@/hooks/use-toast';
import { Professional, ProfessionalServiceCommission } from '@/types/database';

interface Props {
  professional: Professional;
  onClose: () => void;
}

export function ProfessionalCommissions({ professional, onClose }: Props) {
  const { toast } = useToast();
  const { data: services = [] } = useActiveServices();
  const { data: commissions = [], isLoading } = useServiceCommissions(professional.id);
  const upsertCommission = useUpsertServiceCommission();
  const deleteCommission = useDeleteServiceCommission();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionValue, setCommissionValue] = useState('');

  // Services that don't have custom commissions yet
  const availableServices = services.filter(
    s => !commissions.some(c => c.service_id === s.id)
  );

  const handleAddCommission = async () => {
    if (!selectedService || !commissionValue) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos' });
      return;
    }

    try {
      await upsertCommission.mutateAsync({
        professional_id: professional.id,
        service_id: selectedService,
        type: commissionType,
        value: parseFloat(commissionValue),
      });
      toast({ title: 'Comissão adicionada!' });
      setShowAdd(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleDeleteCommission = async (id: string) => {
    try {
      await deleteCommission.mutateAsync(id);
      toast({ title: 'Comissão removida' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setCommissionType('percent');
    setCommissionValue('');
  };

  const formatCommission = (commission: ProfessionalServiceCommission & { service: any }) => {
    if (commission.type === 'percent') {
      return `${commission.value}%`;
    }
    return `R$ ${commission.value.toFixed(2)}`;
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Comissões de {professional.display_name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Default commission info */}
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Comissão padrão</p>
                  <p className="text-xs text-muted-foreground">
                    Aplicada a serviços sem regra específica
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {professional.commission_percent_default}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Custom commissions list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Comissões personalizadas</h3>
              {availableServices.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma comissão personalizada</p>
                <p className="text-xs">Todos os serviços usam a comissão padrão</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commissions.map((commission) => (
                  <Card key={commission.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {commission.type === 'percent' ? (
                              <Percent className="h-5 w-5 text-primary" />
                            ) : (
                              <DollarSign className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{commission.service?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Preço: R$ {commission.service?.price?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{formatCommission(commission)}</Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteCommission(commission.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add commission form */}
          {showAdd && (
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Nova comissão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R$ {service.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={commissionType} 
                      onValueChange={(v) => setCommissionType(v as 'percent' | 'fixed')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(e.target.value)}
                      placeholder={commissionType === 'percent' ? '40' : '25.00'}
                      min="0"
                      step={commissionType === 'percent' ? '1' : '0.01'}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleAddCommission}
                    disabled={upsertCommission.isPending}
                  >
                    {upsertCommission.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}