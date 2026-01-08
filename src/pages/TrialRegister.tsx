import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TrialRegister() {
  const { code } = useParams<{ code: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [linkData, setLinkData] = useState<{ id: string; notes: string | null } | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    validateLink();
  }, [code]);

  const validateLink = async () => {
    if (!code) {
      setValidating(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('trial_invite_links')
        .select('id, notes, active')
        .eq('code', code.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLinkValid(true);
        setLinkData(data);
      }
    } catch (error) {
      console.error('Error validating link:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkData) return;

    setLoading(true);
    try {
      // Create user account
      const { error: signUpError } = await signUp(email, password, fullName);
      
      if (signUpError) {
        throw signUpError;
      }

      // Add to free_trial_users table
      const { error: trialError } = await supabase
        .from('free_trial_users')
        .insert({
          email: email.toLowerCase(),
          invite_link_id: linkData.id,
          notes: `Registrado via link: ${code}`,
        });

      if (trialError && trialError.code !== '23505') {
        console.error('Error adding to free trial:', trialError);
      }

      // Increment usage count - direct update
      const { data: currentLink } = await supabase
        .from('trial_invite_links')
        .select('usage_count')
        .eq('id', linkData.id)
        .single();
      
      if (currentLink) {
        await supabase
          .from('trial_invite_links')
          .update({ usage_count: (currentLink.usage_count || 0) + 1 })
          .eq('id', linkData.id);
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você tem acesso gratuito ilimitado. Verifique seu e-mail para confirmar a conta."
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Link Inválido</CardTitle>
            <CardDescription>
              Este link de convite não existe ou foi desativado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Minha Agenda Online</h1>
          <div className="flex items-center gap-2 mt-2 text-green-600">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">Teste Gratuito Ilimitado</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar Conta Gratuita</CardTitle>
            <CardDescription>
              Você foi convidado para usar nossa plataforma gratuitamente!
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta gratuita"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Já tem uma conta?{' '}
                <button 
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => navigate('/login')}
                >
                  Entrar
                </button>
              </p>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
