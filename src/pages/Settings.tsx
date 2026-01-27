import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeBlockManager } from '@/components/TimeBlockManager';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Building2, LogOut, Save, Gem, Crown, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CommissionFeeSettings } from '@/components/CommissionFeeSettings';
import { SalonLogoUpload } from '@/components/SalonLogoUpload';

export default function Settings() {
  const { salon, profile, user, salonPlan, isAdmin, isSuperAdmin, signOut, refreshProfile, maxProfessionals } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Salon form
  const [salonName, setSalonName] = useState(salon?.name || '');
  const [salonPhone, setSalonPhone] = useState(salon?.phone || '');
  const [salonAddress, setSalonAddress] = useState(salon?.address || '');
  const [savingSalon, setSavingSalon] = useState(false);

  // Password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveSalon = async () => {
    if (!salon?.id) return;
    setSavingSalon(true);
    try {
      const { error } = await supabase
        .from('salons')
        .update({
          name: salonName,
          phone: salonPhone || null,
          address: salonAddress || null,
        })
        .eq('id', salon.id);
      
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Dados salvos!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setSavingSalon(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'A senha deve ter no mínimo 6 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem' });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ title: 'Senha alterada com sucesso!' });
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout title="Configurações">
      <div className="space-y-4">
        <Tabs defaultValue="salon">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="salon">
              <Building2 className="h-4 w-4 mr-2" />
              Salão
            </TabsTrigger>
            <TabsTrigger value="blocks">
              Bloqueios
            </TabsTrigger>
          </TabsList>

          {/* Salon Tab */}
          <TabsContent value="salon" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6 space-y-4">
                {/* Salon Logo */}
                <div className="flex flex-col items-center gap-2">
                  <SalonLogoUpload 
                    logoUrl={(salon as any)?.logo_url || null}
                    salonName={salon?.name || 'Salão'}
                    onUploadSuccess={async () => {
                      await refreshProfile();
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {isAdmin ? 'Clique para alterar o logo' : salon?.name}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label>Nome do salão</Label>
                  <Input
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={salonPhone}
                    onChange={(e) => setSalonPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input
                    value={salonAddress}
                    onChange={(e) => setSalonAddress(e.target.value)}
                    placeholder="Rua, número, bairro"
                    disabled={!isAdmin}
                  />
                </div>
                {isAdmin && (
                  <Button 
                    className="w-full" 
                    onClick={handleSaveSalon}
                    disabled={savingSalon}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingSalon ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Commission Fees Settings */}
            {isAdmin && <CommissionFeeSettings />}

            {/* Plan info */}
            {salonPlan && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{salonPlan.plan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Até {maxProfessionals} profissionais
                      </div>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Profile */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Minha Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(profile?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{profile?.full_name}</div>
                    {user?.email && (
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                    )}
                    <Badge variant="outline" className="mt-1">
                      {isAdmin ? 'Dono do Salão' : 'Profissional'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Alterar senha
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair da conta
                  </Button>
                </div>

                {/* Mobile-only: Upgrade and Super Admin buttons */}
                <div className="md:hidden space-y-2 pt-4 border-t border-border">
                  {(isAdmin || isSuperAdmin) && (
                    <Button 
                      variant="outline" 
                      className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-500/30 hover:from-amber-500/20 hover:to-orange-500/20"
                      onClick={() => navigate('/upgrade')}
                    >
                      <Gem className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  )}
                  {isSuperAdmin && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/super-admin')}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Super Admin
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blocks Tab */}
          <TabsContent value="blocks" className="space-y-4 mt-4">
            <TimeBlockManager />
          </TabsContent>

        </Tabs>
      </div>

      {/* Change Password Sheet */}
      <Sheet open={showChangePassword} onOpenChange={setShowChangePassword}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Alterar Senha</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova senha *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar nova senha *</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {changingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
