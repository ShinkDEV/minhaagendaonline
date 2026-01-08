import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Onboarding() {
  const [error, setError] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const setupAccount = async () => {
      if (!user) return;
      
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

        // Create salon with default name
        const { data: salon, error: salonError } = await supabase
          .from('salons')
          .insert({ name: 'Meu Salão' })
          .select()
          .single();
        
        if (salonError) throw salonError;

        // Update profile with salon_id FIRST
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ salon_id: salon.id })
          .eq('id', user.id);
        
        if (profileError) throw profileError;

        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });
        
        if (roleError) throw roleError;

        // Create salon plan
        const { error: planError } = await supabase
          .from('salon_plan')
          .insert({ salon_id: salon.id, plan_id: freePlan.id });
        
        if (planError) throw planError;

        // Create user as professional
        const { error: profError } = await supabase
          .from('professionals')
          .insert({
            salon_id: salon.id,
            profile_id: user.id,
            display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
            commission_percent_default: 0,
          });
        
        if (profError) throw profError;

        await refreshProfile();
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Setup error:', err);
        setError(err.message);
        toast({ variant: 'destructive', title: 'Erro', description: err.message });
      }
    };

    setupAccount();
  }, [user, navigate, refreshProfile, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
          <Calendar className="h-8 w-8 text-primary-foreground" />
        </div>
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-destructive">Erro ao configurar</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">Preparando...</h1>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </>
        )}
      </div>
    </div>
  );
}
