import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    id: 'free',
    code: 'free',
    name: 'Gratuito',
    price: 0,
    description: 'Para começar',
    maxProfessionals: 1,
    features: [
      '1 profissional',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios básicos',
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    code: 'pro',
    name: 'Profissional',
    price: 49.90,
    description: 'Para salões em crescimento',
    maxProfessionals: 5,
    features: [
      'Até 5 profissionais',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios completos',
      'Comissões automáticas',
      'Suporte prioritário',
    ],
    icon: Sparkles,
    popular: true,
  },
  {
    id: 'business',
    code: 'business',
    name: 'Business',
    price: 99.90,
    description: 'Para grandes salões',
    maxProfessionals: 15,
    features: [
      'Até 15 profissionais',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios avançados',
      'Comissões automáticas',
      'Suporte VIP',
      'Múltiplas unidades',
      'API personalizada',
    ],
    icon: Crown,
  },
];

export default function Upgrade() {
  const { salon } = useAuth();

  const { data: currentPlan } = useQuery({
    queryKey: ['salon-plan', salon?.id],
    queryFn: async () => {
      if (!salon?.id) return null;
      const { data, error } = await supabase
        .from('salon_plan')
        .select('*, plans(*)')
        .eq('salon_id', salon.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!salon?.id,
  });

  const currentPlanCode = currentPlan?.plans?.code || 'free';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>

        {/* Current Plan */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="font-semibold text-lg capitalize">
                  {plans.find(p => p.code === currentPlanCode)?.name || 'Gratuito'}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                Ativo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.code === currentPlanCode;
            const Icon = plan.icon;

            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm">/mês</span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'secondary'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Plano atual' : 'Selecionar'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Todos os planos incluem suporte por email e atualizações gratuitas.
        </p>
      </div>
    </AppLayout>
  );
}
