import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Onboarding() {
  const [loading, setLoading] = useState(true);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const createSalonAndRedirect = async () => {
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

        // Create salon with user's name
        const salonName = user.user_metadata?.full_name 
          ? `Salão ${user.user_metadata.full_name}` 
          : 'Meu Salão';

        const { data: salon, error: salonError } = await supabase
          .from('salons')
          .insert({
            name: salonName,
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
          .eq('id', user.id);
        
        if (profileError) throw profileError;

        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin',
          });
        
        if (roleError) throw roleError;

        // Create the user as a professional too
        const { error: profError } = await supabase
          .from('professionals')
          .insert({
            salon_id: salon.id,
            profile_id: user.id,
            display_name: user.user_metadata?.full_name || user.email || 'Admin',
            commission_percent_default: 0,
          });
        
        if (profError) throw profError;

        await refreshProfile();
        navigate('/dashboard');
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao configurar conta', description: error.message });
        setLoading(false);
      }
    };

    createSalonAndRedirect();
  }, [user, navigate, refreshProfile, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
          <Calendar className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Configurando sua conta...</h1>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
