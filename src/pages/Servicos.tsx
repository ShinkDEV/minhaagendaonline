import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, DollarSign, MoreVertical } from 'lucide-react';

const mockServices = [
  { id: 1, name: 'Corte Feminino', duration: 45, price: 80, active: true },
  { id: 2, name: 'Corte Masculino', duration: 30, price: 50, active: true },
  { id: 3, name: 'Escova', duration: 40, price: 60, active: true },
  { id: 4, name: 'Coloração', duration: 120, price: 250, active: true },
  { id: 5, name: 'Manicure', duration: 45, price: 40, active: true },
  { id: 6, name: 'Pedicure', duration: 60, price: 50, active: true },
  { id: 7, name: 'Hidratação', duration: 60, price: 120, active: false },
];

export default function Servicos() {
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

  return (
    <AppLayout title="Serviços">
      <div className="space-y-3">
        {mockServices.map((service) => (
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
                      {formatDuration(service.duration)}
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatPrice(service.price)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
