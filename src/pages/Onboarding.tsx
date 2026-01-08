import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

const steps = ['salon', 'plan', 'complete'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [salonName, setSalonName] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('max_professionals');
      if (error) throw error;
      return data;
    },
  });

  const handleCreateSalon = async () => {
    if (!salonName.trim()) {
      toast({ variant: 'destructive', title: 'Nome do salão é obrigatório' });
      return;
    }
    setStep(1);
  };

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast({ variant: 'destructive', title: 'Selecione um plano' });
      return;
    }
    
    setLoading(true);
    try {
      // Create salon
      const { data: salon, error: salonError } = await supabase
        .from('salons')
        .insert({
          name: salonName,
          phone: salonPhone || null,
          address: salonAddress || null,
        })
        .select()
        .single();
      
      if (salonError) throw salonError;

      // Create salon plan
      const { error: planError } = await supabase
        .from('salon_plan')
        .insert({
          salon_id: salon.id,
          plan_id: selectedPlan,
        });
      
      if (planError) throw planError;

      // Update profile with salon_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ salon_id: salon.id })
        .eq('id', user?.id);
      
      if (profileError) throw profileError;

      // Add admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user?.id,
          role: 'admin',
        });
      
      if (roleError) throw roleError;

      // Create the user as a professional too
      const { error: profError } = await supabase
        .from('professionals')
        .insert({
          salon_id: salon.id,
          profile_id: user?.id,
          display_name: user?.user_metadata?.full_name || user?.email || 'Admin',
          commission_percent_default: 0,
        });
      
      if (profError) throw profError;

      await refreshProfile();
      setStep(2);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar salão', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Minha Agenda Online</h1>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-16 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Criar seu Salão</CardTitle>
              <CardDescription>Informe os dados do seu salão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salonName">Nome do salão *</Label>
                <Input
                  id="salonName"
                  placeholder="Ex: Salão Beleza"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonPhone">Telefone</Label>
                <Input
                  id="salonPhone"
                  placeholder="(11) 99999-9999"
                  value={salonPhone}
                  onChange={(e) => setSalonPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salonAddress">Endereço</Label>
                <Input
                  id="salonAddress"
                  placeholder="Rua, número, bairro"
                  value={salonAddress}
                  onChange={(e) => setSalonAddress(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleCreateSalon}>
                Próximo
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu Plano</CardTitle>
              <CardDescription>Selecione o plano ideal para seu salão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                {plans?.map((plan) => (
                  <div key={plan.id} className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary transition-colors">
                    <RadioGroupItem value={plan.id} id={plan.id} />
                    <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                      <div className="font-semibold">{plan.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Até {plan.max_professionals} profissionais
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button className="w-full" onClick={handleSelectPlan} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Salão'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Salão Criado!</CardTitle>
              <CardDescription>Seu salão está pronto para uso</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleComplete}>
                Ir para o Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
