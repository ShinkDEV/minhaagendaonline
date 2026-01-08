import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const steps = ['salon', 'complete'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [salonName, setSalonName] = useState('');
  const [salonPhone, setSalonPhone] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateSalon = async () => {
    if (!salonName.trim()) {
      toast({ variant: 'destructive', title: 'Nome do salão é obrigatório' });
      return;
    }
    
    setLoading(true);
    try {
      // Get the free plan
      const { data: freePlan, error: planFetchError } = await supabase
        .from('plans')
        .select('id')
        .eq('code', 'free')
        .single();
      
      if (planFetchError || !freePlan) {
        throw new Error('Plano gratuito não encontrado');
      }

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

      // Create salon plan with free plan
      const { error: planError } = await supabase
        .from('salon_plan')
        .insert({
          salon_id: salon.id,
          plan_id: freePlan.id,
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
      setStep(1);
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
              <Button className="w-full" onClick={handleCreateSalon} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Salão'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Salão Criado!</CardTitle>
              <CardDescription>Seu salão está pronto para uso com o plano Gratuito</CardDescription>
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
