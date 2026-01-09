import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { trackPageView, trackEvent } from '@/lib/analytics';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  Shield,
  Smartphone,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Menu,
  X,
  Zap,
  Target,
  TrendingUp,
  UserCheck,
  Scissors,
  CalendarDays,
  Wallet,
  ClipboardList,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/logo.png';

// Analytics helper
const handleCTAClick = (ctaName: string) => {
  trackEvent('cta_click', { cta: ctaName });
};

// Scroll to section helper
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'professional'>('admin');

  useEffect(() => {
    trackPageView('/');
  }, []);

  const navLinks = [
    { label: 'Como funciona', href: 'como-funciona' },
    { label: 'Recursos', href: 'recursos' },
    { label: 'Planos', href: 'planos' },
    { label: 'Depoimentos', href: 'depoimentos' },
    { label: 'FAQ', href: 'faq' },
  ];

  const problems = [
    { icon: XCircle, text: 'Horários conflitantes e confusão na agenda' },
    { icon: XCircle, text: 'Falta de controle de comissões' },
    { icon: XCircle, text: 'Caixa confuso e sem organização' },
    { icon: XCircle, text: 'Agenda no caderno ou WhatsApp' },
  ];

  const solutions = [
    { icon: CheckCircle2, text: 'Visão clara por profissional' },
    { icon: CheckCircle2, text: 'Evita conflitos automaticamente' },
    { icon: CheckCircle2, text: 'Fecha o caixa com poucos cliques' },
    { icon: CheckCircle2, text: 'Comissões calculadas automaticamente' },
  ];

  const steps = [
    {
      number: '1',
      title: 'Cadastre profissionais e serviços',
      description: 'Configure sua equipe e os serviços oferecidos com preços e duração.',
      icon: Users,
    },
    {
      number: '2',
      title: 'Gerencie agendamentos',
      description: 'Agende atendimentos em poucos toques, sem conflitos de horário.',
      icon: Calendar,
    },
    {
      number: '3',
      title: 'Acompanhe resultados',
      description: 'Conclua atendimentos e veja comissões e financeiro em tempo real.',
      icon: BarChart3,
    },
  ];

  const features = [
    { icon: CalendarDays, title: 'Agenda visual', description: 'Visualize por dia, semana ou lista, separado por profissional.' },
    { icon: UserCheck, title: 'Equipe agenda', description: 'O agendamento é feito pela equipe para total controle.' },
    { icon: Shield, title: 'Bloqueio de conflitos', description: 'Sistema impede automaticamente horários sobrepostos.' },
    { icon: Users, title: 'Cadastro de clientes', description: 'Histórico completo de atendimentos por cliente.' },
    { icon: Scissors, title: 'Serviços e preços', description: 'Gerencie serviços com duração e valores personalizados.' },
    { icon: DollarSign, title: 'Comissões', description: 'Configure por profissional ou por serviço automaticamente.' },
    { icon: Wallet, title: 'Controle financeiro', description: 'Registre entradas e saídas do seu salão.' },
    { icon: ClipboardList, title: 'Relatórios', description: 'Análises por período, profissional e serviço.' },
  ];

  const plans = [
    {
      name: 'Básico',
      price: 'R$ 49',
      period: '/mês',
      description: 'Para profissionais autônomos',
      features: ['1 profissional', 'Agenda ilimitada', 'Cadastro de clientes', 'Controle financeiro básico'],
      highlighted: false,
    },
    {
      name: 'Profissional',
      price: 'R$ 99',
      period: '/mês',
      description: 'Para salões pequenos',
      features: ['Até 5 profissionais', 'Agenda ilimitada', 'Cadastro de clientes', 'Comissões automáticas', 'Relatórios completos'],
      highlighted: true,
    },
    {
      name: 'Empresarial',
      price: 'R$ 199',
      period: '/mês',
      description: 'Para salões maiores',
      features: ['Profissionais ilimitados', 'Agenda ilimitada', 'Cadastro de clientes', 'Comissões automáticas', 'Relatórios avançados', 'Suporte prioritário'],
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      initials: 'M. S.',
      role: 'Proprietária de salão',
      text: 'Finalmente consigo ver quanto cada profissional produziu no mês sem precisar fazer contas no papel!',
    },
    {
      initials: 'R. O.',
      role: 'Barbeiro autônomo',
      text: 'Minha agenda estava uma bagunça. Agora em 2 minutos marco os clientes e sei exatamente meus horários livres.',
    },
    {
      initials: 'A. L.',
      role: 'Gerente de salão',
      text: 'O controle de comissões era um pesadelo. Com o sistema, tudo fica calculado automaticamente.',
    },
  ];

  const faqs = [
    {
      question: 'O cliente consegue agendar sozinho?',
      answer: 'Não, o agendamento é feito pela equipe para total controle da sua agenda. Isso evita conflitos e garante que você tenha controle total dos horários.',
    },
    {
      question: 'Funciona no celular?',
      answer: 'Sim, o webapp é 100% responsivo. Funciona perfeitamente no computador, tablet ou celular.',
    },
    {
      question: 'Consigo controlar comissões?',
      answer: 'Sim! Você pode configurar comissões por profissional ou por serviço. O sistema calcula tudo automaticamente.',
    },
    {
      question: 'Consigo ver relatórios?',
      answer: 'Sim. Temos relatórios por período, por profissional e por serviço. Você acompanha tudo em tempo real.',
    },
    {
      question: 'Consigo cadastrar profissionais?',
      answer: 'Sim, você cadastra todos os profissionais do seu salão e cada um tem sua própria agenda.',
    },
    {
      question: 'Posso começar com poucos profissionais e crescer?',
      answer: 'Sim! Você pode fazer upgrade do plano a qualquer momento conforme seu salão cresce.',
    },
  ];

  const targetAudience = [
    {
      icon: Target,
      title: 'Donos de salões',
      description: 'Que querem ganhar tempo e ter controle total do negócio.',
    },
    {
      icon: Zap,
      title: 'Profissionais autônomos',
      description: 'Que querem organizar a agenda e crescer profissionalmente.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags are in index.html */}
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={logo} alt="Minha Agenda Online" className="h-10 w-auto" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Button size="sm" onClick={() => { handleCTAClick('header'); scrollToSection('planos'); }}>
                Quero assinar
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => { scrollToSection(link.href); setMobileMenuOpen(false); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="w-full">Entrar</Button>
                  </Link>
                  <Button size="sm" className="w-full" onClick={() => { handleCTAClick('mobile-header'); scrollToSection('planos'); setMobileMenuOpen(false); }}>
                    Quero assinar
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                A agenda do seu salão organizada em minutos.
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto lg:mx-0">
                Gerencie agendamentos, comissões e financeiro do seu salão em um só lugar. Simples, rápido e no celular.
              </p>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
                <Badge variant="secondary" className="gap-1">
                  <Smartphone className="h-3 w-3" /> Mobile-first
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" /> Rápido
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" /> Comissões
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <BarChart3 className="h-3 w-3" /> Relatórios
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="gap-2" onClick={() => { handleCTAClick('hero'); scrollToSection('planos'); }}>
                  Quero assinar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* App Mock */}
            <div className="relative">
              <div className="bg-card border rounded-2xl shadow-2xl p-4 md:p-6 max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Agenda - Hoje</span>
                </div>
                
                <div className="space-y-3">
                  {[
                    { time: '09:00', client: 'Maria S.', service: 'Corte + Escova', color: 'bg-primary/20 border-primary/40' },
                    { time: '10:30', client: 'Ana L.', service: 'Coloração', color: 'bg-accent border-accent-foreground/20' },
                    { time: '14:00', client: 'Paula R.', service: 'Manicure', color: 'bg-secondary border-border' },
                  ].map((item, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${item.color}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{item.client}</p>
                          <p className="text-xs text-muted-foreground">{item.service}</p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total do dia</span>
                    <span className="font-semibold text-primary">R$ 280,00</span>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-lg hidden md:block">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+23% este mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Chega de dor de cabeça com a agenda</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Transforme a gestão do seu salão com uma solução simples e eficiente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Problems */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" /> Sem sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {problems.map((problem, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <problem.icon className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span>{problem.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Solutions */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" /> Com Minha Agenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {solutions.map((solution, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <solution.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{solution.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Como funciona</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Em 3 passos simples você organiza toda a gestão do seu salão.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm mb-3">
                  {step.number}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-16 bg-muted/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Tudo que você precisa</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recursos pensados para facilitar o dia a dia do seu salão.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Para quem é</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {targetAudience.map((item, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Comparison */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">O que cada perfil pode fazer</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Permissões diferentes para administradores e profissionais.
            </p>

            {/* Toggle Buttons */}
            <div className="inline-flex flex-col sm:flex-row rounded-lg border bg-card p-1 gap-1 w-full sm:w-auto max-w-sm mx-auto sm:max-w-none">
              <Button
                variant={selectedRole === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRole('admin')}
                className="gap-2 text-xs sm:text-sm"
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span>Administrador</span>
              </Button>
              <Button
                variant={selectedRole === 'professional' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedRole('professional')}
                className="gap-2 text-xs sm:text-sm"
              >
                <Scissors className="h-4 w-4 shrink-0" />
                <span>Profissional</span>
              </Button>
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            {/* Admin Card */}
            {selectedRole === 'admin' && (
              <Card className="border-primary/30">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Administrador</CardTitle>
                      <CardDescription>Controle total do salão</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Criar e gerenciar agendamentos',
                      'Cadastrar profissionais e serviços',
                      'Cadastrar e editar clientes',
                      'Definir preços e comissões',
                      'Ver relatórios completos',
                      'Controlar entradas e saídas financeiras',
                      'Convidar novos membros da equipe',
                      'Gerenciar configurações do salão',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Professional Card */}
            {selectedRole === 'professional' && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Scissors className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profissional</CardTitle>
                      <CardDescription>Foco no atendimento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Ver sua própria agenda',
                      'Visualizar detalhes dos agendamentos',
                      'Ver suas próprias comissões',
                      'Acompanhar histórico de atendimentos',
                      'Atualizar seu perfil',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Profissionais têm acesso focado para visualizar apenas o que é relevante para seu trabalho.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-16 bg-muted/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Planos que cabem no seu salão</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sem fidelidade. Cancele quando quiser. 7 dias de garantia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mais popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 text-sm mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login">
                    <Button 
                      className="w-full" 
                      variant={plan.highlighted ? 'default' : 'outline'}
                      onClick={() => handleCTAClick(`plan-${plan.name.toLowerCase()}`)}
                    >
                      Escolher plano
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Todos os planos incluem 7 dias de garantia. Não gostou? Devolvemos seu dinheiro.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">O que dizem nossos clientes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <p className="text-sm mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary text-sm">{testimonial.initials}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{testimonial.role}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 bg-muted/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Perguntas frequentes</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border rounded-lg px-4">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Pronto para organizar sua agenda e seu caixa?
            </h2>
            <p className="mb-8 opacity-90">
              Leva menos de 2 minutos para começar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="gap-2"
                  onClick={() => handleCTAClick('final-cta')}
                >
                  Quero me organizar agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a 
                href="https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o Minha Agenda Online" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Minha Agenda Online" className="h-6 w-auto" />
              <span className="font-semibold">Minha Agenda Online</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <a href="mailto:contato@minhaagendaonline.com" className="hover:text-foreground transition-colors">
                Contato
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Minha Agenda Online. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
