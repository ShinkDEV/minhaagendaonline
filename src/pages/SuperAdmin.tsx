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
  PieChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  // Fetch all salons with details
  const { data: salons = [], isLoading, refetch } = useQuery({
    queryKey: ['super-admin-salons'],
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
        
        return {
          id: salon.id,
          name: salon.name,
          phone: salon.phone,
          address: salon.address,
          created_at: salon.created_at,
          professionals_count: salonProfessionals.length,
          plan_name: (plan?.plan as any)?.name || 'Sem plano',
          plan_code: (plan?.plan as any)?.code || null,
          owner_email: null, // Would need edge function to get
          owner_name: owner?.full_name || 'Desconhecido',
        };
      });

      return salonsWithDetails;
    },
    enabled: isSuperAdmin,
  });

  // Filter salons by search
  const filteredSalons = salons.filter(salon => 
    salon.name.toLowerCase().includes(search.toLowerCase()) ||
    salon.owner_name?.toLowerCase().includes(search.toLowerCase())
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salons" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Salões
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Financeiro
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