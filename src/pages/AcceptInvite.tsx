import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useInvitationByToken, useAcceptInvitation } from '@/hooks/useInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  
  const [mode, setMode] = useState<'loading' | 'signup' | 'login' | 'accept'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: invitation, isLoading, error } = useInvitationByToken(token || null);
  const acceptInvitation = useAcceptInvitation();

  useEffect(() => {
    if (isLoading) return;
    
    if (!invitation) {
      setMode('loading');
      return;
    }

    if (user) {
      setMode('accept');
    } else {
      setEmail(invitation.email);
      setMode('signup');
    }
  }, [invitation, user, isLoading]);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos' });
      return;
    }

    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/invite/${token}`,
        },
      });

      if (error) throw error;

      toast({ 
        title: 'Conta criada!', 
        description: 'Verifique seu email para confirmar o cadastro.' 
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !token) return;

    setIsSubmitting(true);
    try {
      await acceptInvitation.mutateAsync({ token, userId: user.id });
      await refreshProfile();
      toast({ title: 'Convite aceito!', description: 'Bem-vindo ao salão!' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation || invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Convite Inválido</h2>
            <p className="text-muted-foreground mb-4">
              Este convite não existe, já foi utilizado ou expirou.
            </p>
            <Button onClick={() => navigate('/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Convite Expirado</h2>
            <p className="text-muted-foreground mb-4">
              Este convite expirou. Solicite um novo convite ao administrador do salão.
            </p>
            <Button onClick={() => navigate('/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convite para Profissional
          </CardTitle>
          <CardDescription>
            Você foi convidado para fazer parte do salão
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Salon Info */}
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{invitation.salon?.name}</span>
            </div>
            <Badge variant="outline">Profissional</Badge>
          </div>

          {mode === 'accept' && user ? (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  Logado como <strong>{user.email}</strong>
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAccept}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aceitando...</>
                ) : (
                  'Aceitar Convite'
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => supabase.auth.signOut()}
              >
                Usar outra conta
              </Button>
            </div>
          ) : mode === 'signup' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSignUp}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
                ) : (
                  'Criar Conta'
                )}
              </Button>
              <Button 
                variant="link" 
                className="w-full"
                onClick={() => setMode('login')}
              >
                Já tenho uma conta
              </Button>
            </div>
          ) : mode === 'login' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</>
                ) : (
                  'Entrar'
                )}
              </Button>
              <Button 
                variant="link" 
                className="w-full"
                onClick={() => setMode('signup')}
              >
                Criar nova conta
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
