import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Clock, DollarSign, MoreVertical, Pencil } from 'lucide-react';
import { useServices, useCreateService, useUpdateService } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types/database';

export default function Servicos() {
  const [showNewService, setShowNewService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const { data: services = [], isLoading } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const resetForm = () => {
    setName('');
    setDuration('60');
    setPrice('');
    setEditingService(null);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDuration(service.duration_minutes.toString());
    setPrice(service.price.toString());
    setShowNewService(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }
    if (!price || isNaN(Number(price))) {
      toast({ variant: 'destructive', title: 'Preço inválido' });
      return;
    }

    try {
      if (editingService) {
        await updateService.mutateAsync({
          id: editingService.id,
          name,
          duration_minutes: parseInt(duration),
          price: parseFloat(price),
        });
        toast({ title: 'Serviço atualizado!' });
      } else {
        await createService.mutateAsync({
          name,
          duration_minutes: parseInt(duration),
          price: parseFloat(price),
        });
        toast({ title: 'Serviço criado!' });
      }
      setShowNewService(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        active: !service.active,
      });
      toast({ title: service.active ? 'Serviço desativado' : 'Serviço ativado' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  return (
    <AppLayout title="Serviços">
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum serviço cadastrado
          </div>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{service.name}</span>
                      {!service.active && (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(service.duration_minutes)}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-primary">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatPrice(Number(service.price))}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(service)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* New/Edit Service Sheet */}
        <Sheet open={showNewService} onOpenChange={(open) => {
          setShowNewService(open);
          if (!open) resetForm();
        }}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Feminino"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    type="number"
                    min="15"
                    step="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                  />
                </div>
              </div>
              {editingService && (
                <div className="flex items-center justify-between">
                  <Label>Serviço ativo</Label>
                  <Switch
                    checked={editingService.active}
                    onCheckedChange={() => toggleActive(editingService)}
                  />
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={handleSave}
                disabled={createService.isPending || updateService.isPending}
              >
                {(createService.isPending || updateService.isPending) ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* FAB */}
        {isAdmin && (
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowNewService(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
