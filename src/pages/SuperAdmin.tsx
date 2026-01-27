import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Search, 
  Crown, 
  Calendar,
  LogOut,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  PieChart,
  Megaphone,
  Gift,
  Plus,
  Trash2,
  Loader2,
  Link,
  Copy,
  Check,
  Mail,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementManager } from '@/components/announcements/AnnouncementManager';
import { FAQManager } from '@/components/admin/FAQManager';
import { FAQFeedbackStats } from '@/components/admin/FAQFeedbackStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ban, RotateCcw } from 'lucide-react';

// Preços estimados por plano (em R$)
const PLAN_PRICES: Record<string, number> = {
  'starter': 49.90,
  'pro': 99.90,
  'premium': 199.90,
};

interface SubscriptionHistory {
  salon_id: string;
  salon_name: string;
  plan_name: string;
  plan_code: string;
  started_at: string;
}
interface SalonWithDetails {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  professionals_count: number;
  plan_name: string | null;
  plan_code: string | null;
  owner_email: string | null;
  owner_name: string | null;
}

export default function SuperAdmin() {
  const { isSuperAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedSalon, setSelectedSalon] = useState<SalonWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newTrialEmail, setNewTrialEmail] = useState('');
  const [newTrialNotes, setNewTrialNotes] = useState('');
  const [isAddingTrial, setIsAddingTrial] = useState(false);
  const [newLinkNotes, setNewLinkNotes] = useState('');
  const [newLinkDays, setNewLinkDays] = useState('14');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('salons');

  // Fetch all plans
  const { data: plans = [] } = useQuery({
    queryKey: ['all-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('max_professionals');
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Fetch subscription history
  const { data: subscriptionHistory = [] } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      const { data: salonPlans, error: spError } = await supabase
        .from('salon_plan')
        .select('salon_id, plan_id, started_at')
        .order('started_at', { ascending: false });
      
      if (spError) throw spError;

      const { data: salonsData } = await supabase
        .from('salons')
        .select('id, name');

      const { data: plansData } = await supabase
        .from('plans')
        .select('id, name, code');

      const history: SubscriptionHistory[] = (salonPlans || []).map(sp => {
        const salon = salonsData?.find(s => s.id === sp.salon_id);
        const plan = plansData?.find(p => p.id === sp.plan_id);
        return {
          salon_id: sp.salon_id,
          salon_name: salon?.name || 'Desconhecido',
          plan_name: plan?.name || 'Sem plano',
          plan_code: plan?.code || '',
          started_at: sp.started_at,
        };
      });

      return history;
    },
    enabled: isSuperAdmin,
  });

  // Fetch free trial users
  const { data: freeTrialUsers = [], refetch: refetchTrials } = useQuery({
    queryKey: ['free-trial-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('free_trial_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Fetch trial invite links
  const { data: inviteLinks = [], refetch: refetchLinks } = useQuery({
    queryKey: ['trial-invite-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_invite_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Fetch salon owner emails
  const { data: salonOwners = {} } = useQuery({
    queryKey: ['salon-owners'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-salon-owners');
      if (error) throw error;
      return data?.salon_owners || {};
    },
    enabled: isSuperAdmin,
  });

  // Fetch all salons with details
  const { data: salons = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-salons', salonOwners],
    queryFn: async () => {
      // Get all salons
      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (salonsError) throw salonsError;

      // Get salon plans
      const { data: salonPlans } = await supabase
        .from('salon_plan')
        .select('salon_id, plan:plans(name, code)');

      // Get professionals count per salon
      const { data: professionals } = await supabase
        .from('professionals')
        .select('salon_id, active');

      // Get profiles to find owners
      const { data: profiles } = await supabase
        .from('profiles')
        .select('salon_id, full_name, id');

      // Get user emails from auth (we'll use profile info)
      const salonsWithDetails: SalonWithDetails[] = salonsData.map(salon => {
        const plan = salonPlans?.find(sp => sp.salon_id === salon.id);
        const salonProfessionals = professionals?.filter(p => p.salon_id === salon.id && p.active) || [];
        const owner = profiles?.find(p => p.salon_id === salon.id);
        const ownerData = salonOwners[salon.id];
        
        return {
          id: salon.id,
          name: salon.name,
          phone: salon.phone,
          address: salon.address,
          created_at: salon.created_at,
          professionals_count: salonProfessionals.length,
          plan_name: (plan?.plan as any)?.name || 'Sem plano',
          plan_code: (plan?.plan as any)?.code || null,
          owner_email: ownerData?.email || null,
          owner_name: ownerData?.name || owner?.full_name || 'Desconhecido',
        };
      });

      return salonsWithDetails;
    },
    enabled: isSuperAdmin,
  });

  // Filter salons by search
  const filteredSalons = salons.filter(salon => 
    salon.name.toLowerCase().includes(search.toLowerCase()) ||
    salon.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    salon.owner_email?.toLowerCase().includes(search.toLowerCase())
  );

  // Update salon plan
  const handleUpdatePlan = async (salonId: string, planId: string) => {
    try {
      // Check if salon already has a plan
      const { data: existing } = await supabase
        .from('salon_plan')
        .select('*')
        .eq('salon_id', salonId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('salon_plan')
          .update({ plan_id: planId, started_at: new Date().toISOString() })
          .eq('salon_id', salonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('salon_plan')
          .insert({ salon_id: salonId, plan_id: planId });
        if (error) throw error;
      }

      toast({ title: 'Plano atualizado!' });
      refetch();
      setShowDetails(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleAddFreeTrial = async () => {
    if (!newTrialEmail.trim()) {
      toast({ variant: 'destructive', title: 'Email obrigatório' });
      return;
    }

    setIsAddingTrial(true);
    try {
      const { error } = await supabase
        .from('free_trial_users')
        .insert({
          email: newTrialEmail.trim().toLowerCase(),
          notes: newTrialNotes.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este email já possui teste gratuito');
        }
        throw error;
      }

      toast({ title: 'Teste gratuito adicionado!' });
      setNewTrialEmail('');
      setNewTrialNotes('');
      refetchTrials();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsAddingTrial(false);
    }
  };

  const handleRemoveFreeTrial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('free_trial_users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Teste gratuito removido' });
      refetchTrials();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleCancelFreeTrial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('free_trial_users')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Teste gratuito cancelado' });
      refetchTrials();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleReactivateFreeTrial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('free_trial_users')
        .update({ cancelled_at: null })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Teste gratuito reativado' });
      refetchTrials();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleCreateInviteLink = async () => {
    const trialDays = parseInt(newLinkDays);
    if (isNaN(trialDays) || trialDays < 1 || trialDays > 365) {
      toast({ variant: 'destructive', title: 'Período inválido', description: 'Informe um número entre 1 e 365 dias' });
      return;
    }

    setIsCreatingLink(true);
    try {
      // Generate random code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase
        .from('trial_invite_links')
        .insert({
          code,
          notes: newLinkNotes.trim() || null,
          trial_days: trialDays,
        });

      if (error) throw error;

      toast({ title: 'Link de convite criado!' });
      setNewLinkNotes('');
      setNewLinkDays('14');
      refetchLinks();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleToggleLinkActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('trial_invite_links')
        .update({ active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast({ title: currentActive ? 'Link desativado' : 'Link ativado' });
      refetchLinks();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trial_invite_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Link removido' });
      refetchLinks();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const copyLinkToClipboard = (code: string, id: string) => {
    const url = `${window.location.origin}/trial-register/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
    toast({ title: 'Link copiado!' });
  };

  const openSalonDetails = (salon: SalonWithDetails) => {
    setSelectedSalon(salon);
    setShowDetails(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPlanBadgeVariant = (planCode: string | null) => {
    switch (planCode) {
      case 'premium': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  // Calculate revenue by plan
  const revenueByPlan = plans.map(plan => {
    const count = salons.filter(s => s.plan_code === plan.code).length;
    const price = PLAN_PRICES[plan.code] || 0;
    return {
      plan_name: plan.name,
      plan_code: plan.code,
      count,
      monthly_revenue: count * price,
      price,
    };
  });

  const totalMonthlyRevenue = revenueByPlan.reduce((acc, p) => acc + p.monthly_revenue, 0);
  const totalWithPlan = salons.filter(s => s.plan_code).length;

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <div>
              <h1 className="font-semibold text-sm">Painel Super Admin</h1>
              <p className="text-[10px] text-muted-foreground">Gerenciamento de clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{salons.length}</p>
                  <p className="text-xs text-muted-foreground">Salões</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Receita/mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="salons" className="flex items-center gap-1 text-xs">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Salões</span>
            </TabsTrigger>
            <TabsTrigger value="trials" className="flex items-center gap-1 text-xs">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Trials</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-1 text-xs">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Anúncios</span>
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-1 text-xs">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQs</span>
            </TabsTrigger>
          </TabsList>

          {/* Salons Tab */}
          <TabsContent value="salons" className="space-y-4 mt-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar salão..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Salons list */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Salões Cadastrados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : filteredSalons.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum salão encontrado
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredSalons.map((salon) => (
                      <button
                        key={salon.id}
                        onClick={() => openSalonDetails(salon)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(salon.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{salon.name}</span>
                            <Badge variant={getPlanBadgeVariant(salon.plan_code)}>
                              {salon.plan_name}
                            </Badge>
                          </div>
                          {salon.owner_email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{salon.owner_email}</span>
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {salon.professionals_count} profissionais
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(salon.created_at), "dd MMM yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Free Trials Tab */}
          <TabsContent value="trials" className="space-y-4 mt-4">
            {/* Add new trial */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Adicionar Teste Gratuito
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email do usuário"
                  value={newTrialEmail}
                  onChange={(e) => setNewTrialEmail(e.target.value)}
                />
                <Input
                  placeholder="Notas (opcional)"
                  value={newTrialNotes}
                  onChange={(e) => setNewTrialNotes(e.target.value)}
                />
                <Button 
                  className="w-full" 
                  onClick={handleAddFreeTrial}
                  disabled={isAddingTrial}
                >
                  {isAddingTrial ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Adicionar Teste Gratuito Ilimitado
                </Button>
              </CardContent>
            </Card>

            {/* Invite Links */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Links de Convite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Notas do link (opcional)"
                      value={newLinkNotes}
                      onChange={(e) => setNewLinkNotes(e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Dias"
                      value={newLinkDays}
                      onChange={(e) => setNewLinkDays(e.target.value)}
                      min={1}
                      max={365}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Período do trial: {newLinkDays} {parseInt(newLinkDays) === 1 ? 'dia' : 'dias'}
                </p>
                <Button 
                  className="w-full" 
                  onClick={handleCreateInviteLink}
                  disabled={isCreatingLink}
                  variant="outline"
                >
                  {isCreatingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar Link de Convite
                </Button>

                {inviteLinks.length > 0 && (
                  <div className="divide-y divide-border border rounded-lg mt-4">
                    {inviteLinks.map((link) => (
                      <div key={link.id} className="p-3 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                              {link.code}
                            </code>
                            <Badge variant={link.active ? 'default' : 'secondary'}>
                              {link.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {link.usage_count} uso(s)
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {link.trial_days} dias
                            </span>
                            {link.notes && (
                              <span>• {link.notes}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => copyLinkToClipboard(link.code, link.id)}
                          >
                            {copiedLinkId === link.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleToggleLinkActive(link.id, link.active)}
                          >
                            <Link className={`h-4 w-4 ${link.active ? 'text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trial users list */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Usuários com Teste Gratuito ({freeTrialUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {freeTrialUsers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum usuário com teste gratuito
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {freeTrialUsers.map((trial) => (
                      <div key={trial.id} className={`p-4 flex items-center justify-between ${trial.cancelled_at ? 'bg-destructive/5' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{trial.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            Criado: {format(new Date(trial.created_at), "dd MMM yyyy", { locale: ptBR })}
                          </div>
                          {trial.activated_at && !trial.cancelled_at && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Ativado em {format(new Date(trial.activated_at), "dd MMM yyyy", { locale: ptBR })}
                            </div>
                          )}
                          {trial.cancelled_at && (
                            <div className="text-xs text-destructive mt-1">
                              ✗ Cancelado em {format(new Date(trial.cancelled_at), "dd MMM yyyy", { locale: ptBR })}
                            </div>
                          )}
                          {trial.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{trial.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {trial.cancelled_at ? (
                            <Badge variant="destructive">Cancelado</Badge>
                          ) : (
                            <Badge variant="secondary">Ilimitado</Badge>
                          )}
                          {trial.cancelled_at ? (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleReactivateFreeTrial(trial.id)}
                              title="Reativar trial"
                            >
                              <RotateCcw className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleCancelFreeTrial(trial.id)}
                              title="Cancelar trial"
                            >
                              <Ban className="h-4 w-4 text-orange-500" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveFreeTrial(trial.id)}
                            title="Remover permanentemente"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4 mt-4">
            {/* Revenue by Plan */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Receita por Plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {revenueByPlan.map((item) => (
                  <div key={item.plan_code} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPlanBadgeVariant(item.plan_code)}>
                          {item.plan_name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {item.count} salões
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        R$ {item.price.toFixed(2)}/mês
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-2 flex-1 bg-background rounded-full overflow-hidden mr-3">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${totalWithPlan > 0 ? (item.count / totalWithPlan) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="font-semibold text-primary">
                        R$ {item.monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-primary/10 rounded-lg mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Mensal Estimado</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalWithPlan} salões com plano ativo
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription History */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Histórico de Assinaturas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {subscriptionHistory.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma assinatura registrada
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {subscriptionHistory.map((item, idx) => (
                      <div key={`${item.salon_id}-${idx}`} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.salon_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.started_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant={getPlanBadgeVariant(item.plan_code)}>
                          {item.plan_name}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="mt-4">
            <AnnouncementManager />
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="space-y-6 mt-4">
            <FAQFeedbackStats />
            <FAQManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Salon Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Detalhes do Salão</SheetTitle>
          </SheetHeader>
          {selectedSalon && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                    {getInitials(selectedSalon.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedSalon.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedSalon.owner_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Profissionais</p>
                  <p className="font-semibold">{selectedSalon.professionals_count}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="font-semibold">
                    {format(new Date(selectedSalon.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              {selectedSalon.phone && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-semibold">{selectedSalon.phone}</p>
                </div>
              )}

              {selectedSalon.address && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="font-semibold">{selectedSalon.address}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Plano</label>
                <Select
                  defaultValue={plans.find(p => p.name === selectedSalon.plan_name)?.id}
                  onValueChange={(value) => handleUpdatePlan(selectedSalon.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.max_professionals} profissionais)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}