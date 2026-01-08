import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Loader2, Sparkles, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Plans configuration matching Stripe products
const plans = [
  {
    code: 'basic',
    name: 'Basic',
    price: 29,
    description: '1-2 profissionais',
    maxProfessionals: 2,
    features: [
      'Até 2 profissionais',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios básicos',
    ],
    icon: Zap,
  },
  {
    code: 'basic_plus',
    name: 'Basic+',
    price: 49,
    description: '3-5 profissionais',
    maxProfessionals: 5,
    features: [
      'Até 5 profissionais',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios completos',
      'Comissões automáticas',
    ],
    icon: Sparkles,
    popular: true,
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 79,
    description: '6-10 profissionais',
    maxProfessionals: 10,
    features: [
      'Até 10 profissionais',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios avançados',
      'Comissões automáticas',
      'Suporte prioritário',
    ],
    icon: Users,
  },
  {
    code: 'pro_plus',
    name: 'Pro+',
    price: 99,
    description: '11-20 profissionais',
    maxProfessionals: 20,
    features: [
      'Até 20 profissionais',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios avançados',
      'Comissões automáticas',
      'Suporte VIP',
      'Múltiplas unidades',
    ],
    icon: Crown,
  },
  {
    code: 'super',
    name: 'Super',
    price: 299,
    description: '21+ profissionais',
    maxProfessionals: 999,
    features: [
      'Profissionais ilimitados',
      'Agendamentos ilimitados',
      'Gestão de clientes',
      'Relatórios avançados',
      'Comissões automáticas',
      'Suporte VIP dedicado',
      'Múltiplas unidades',
      'API personalizada',
    ],
    icon: Crown,
  },
];

export default function Upgrade() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Check current subscription status
  const { data: subscription, isLoading: isLoadingSubscription, refetch } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const currentPlanCode = subscription?.plan_code || 'free';

  const handleSelectPlan = async (planCode: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Faça login primeiro',
        description: 'Você precisa estar logado para assinar um plano.',
      });
      return;
    }

    setLoadingPlan(planCode);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planCode },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar checkout',
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Não foi possível abrir o portal de gerenciamento.',
      });
    }
  };

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
                {isLoadingSubscription ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <p className="font-semibold text-lg">
                    {currentPlanCode === 'free' 
                      ? 'Gratuito' 
                      : plans.find(p => p.code === currentPlanCode)?.name || 'Desconhecido'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  Ativo
                </Badge>
                {subscription?.subscribed && (
                  <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                    Gerenciar
                  </Button>
                )}
              </div>
            </div>
            {subscription?.subscription_end && (
              <p className="text-xs text-muted-foreground mt-2">
                Próxima renovação: {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Atualizar status da assinatura
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.code === currentPlanCode;
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.code;

            return (
              <Card 
                key={plan.code} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">
                      Seu plano
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
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground text-sm">/mês</span>
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
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleSelectPlan(plan.code)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plano atual'
                    ) : (
                      'Assinar'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Todos os planos incluem suporte por email e atualizações gratuitas.
          <br />
          Cancele a qualquer momento pelo portal do cliente.
        </p>
      </div>
    </AppLayout>
  );
}
