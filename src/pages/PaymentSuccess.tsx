import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, ArrowRight, Calendar, Users, BarChart3 } from 'lucide-react';
import logo from '@/assets/logo.png';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'welcome' | 'register' | 'complete'>('welcome');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    salonName: '',
    phone: '',
  });

  const sessionId = searchParams.get('session_id');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não conferem',
        description: 'Por favor, verifique se as senhas são iguais.',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.fullName,
            salon_name: formData.salonName,
            phone: formData.phone,
          },
        },
      });

      if (error) throw error;

      setStep('complete');
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu email para confirmar o cadastro.',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextSteps = [
    { icon: Users, title: 'Cadastre sua equipe', description: 'Adicione os profissionais do seu salão' },
    { icon: Calendar, title: 'Configure sua agenda', description: 'Defina horários de funcionamento' },
    { icon: BarChart3, title: 'Comece a agendar', description: 'Agende clientes e acompanhe resultados' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/site" className="flex items-center gap-2">
            <img src={logo} alt="Minha Agenda" className="h-8 w-8" />
            <span className="font-bold text-lg">Minha Agenda</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          
          {/* Welcome Step */}
          {step === 'welcome' && (
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Pagamento confirmado! 🎉
                </h1>
                <p className="text-lg text-muted-foreground">
                  Bem-vindo ao Minha Agenda! Sua assinatura está ativa e você já pode começar a usar.
                </p>
              </div>

              <Card className="text-left">
                <CardHeader>
                  <CardTitle className="text-lg">Próximos passos</CardTitle>
                  <CardDescription>Configure seu salão em poucos minutos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button size="lg" className="gap-2" onClick={() => setStep('register')}>
                Criar minha conta <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          )}

          {/* Register Step */}
          {step === 'register' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Crie sua conta</CardTitle>
                <CardDescription>
                  Preencha os dados para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Seu nome completo</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Maria Silva"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salonName">Nome do salão</Label>
                      <Input
                        id="salonName"
                        name="salonName"
                        placeholder="Salão Beleza Total"
                        value={formData.salonName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone (opcional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar senha</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Repita a senha"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Criando conta...
                        </>
                      ) : (
                        'Criar conta e acessar'
                      )}
                    </Button>

                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setStep('welcome')}
                    >
                      Voltar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Conta criada com sucesso! ✨
                </h1>
                <p className="text-lg text-muted-foreground mb-2">
                  Enviamos um email de confirmação para <strong>{formData.email}</strong>
                </p>
                <p className="text-muted-foreground">
                  Clique no link do email para ativar sua conta e começar a usar o sistema.
                </p>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Não recebeu o email? Verifique sua pasta de spam ou{' '}
                    <button 
                      className="text-primary hover:underline"
                      onClick={() => setStep('register')}
                    >
                      tente novamente
                    </button>
                  </p>
                </CardContent>
              </Card>

              <Button size="lg" onClick={() => navigate('/login')}>
                Ir para o login
              </Button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Minha Agenda. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
