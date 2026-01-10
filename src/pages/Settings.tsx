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
import { Switch } from '@/components/ui/switch';
import { Building2, Users, LogOut, Save, Plus, UserCog, Percent, Scissors, Mail, Trash2, Gem, Crown, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfessionals, useCreateProfessional, useUpdateProfessional, useDeleteProfessional } from '@/hooks/useProfessionals';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Professional } from '@/types/database';
import { ProfessionalCommissions } from '@/components/ProfessionalCommissions';
import { InviteProfessional } from '@/components/InviteProfessional';

export default function Settings() {
  const { salon, profile, user, salonPlan, isAdmin, isSuperAdmin, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Salon form
  const [salonName, setSalonName] = useState(salon?.name || '');
  const [salonPhone, setSalonPhone] = useState(salon?.phone || '');
  const [salonAddress, setSalonAddress] = useState(salon?.address || '');
  const [savingSalon, setSavingSalon] = useState(false);
  
  // Professional form
  const [showNewProfessional, setShowNewProfessional] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [commissionsForProfessional, setCommissionsForProfessional] = useState<Professional | null>(null);
  const [profName, setProfName] = useState('');
  const [profCommission, setProfCommission] = useState('40');

  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);

  // Password change
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const { data: professionals = [] } = useProfessionals(true); // include inactive
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const deleteProfessional = useDeleteProfessional();

  const activeProfessionalsCount = professionals.filter(p => p.active).length;
  const maxProfessionals = salonPlan?.plan?.max_professionals || 2;
  const canAddProfessional = activeProfessionalsCount < maxProfessionals;

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

  const resetProfForm = () => {
    setProfName('');
    setProfCommission('40');
    setEditingProfessional(null);
  };

  const openEditProfessional = (prof: Professional) => {
    setEditingProfessional(prof);
    setProfName(prof.display_name);
    setProfCommission(prof.commission_percent_default.toString());
    setShowNewProfessional(true);
  };

  const handleSaveProfessional = async () => {
    if (!profName.trim()) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }

    try {
      if (editingProfessional) {
        await updateProfessional.mutateAsync({
          id: editingProfessional.id,
          display_name: profName,
          commission_percent_default: parseFloat(profCommission) || 0,
        });
        toast({ title: 'Profissional atualizado!' });
      } else {
        if (!canAddProfessional) {
          toast({ 
            variant: 'destructive', 
            title: 'Limite atingido', 
            description: `Seu plano permite até ${maxProfessionals} profissionais. Atualize seu plano para adicionar mais.` 
          });
          return;
        }
        await createProfessional.mutateAsync({
          display_name: profName,
          commission_percent_default: parseFloat(profCommission) || 0,
        });
        toast({ title: 'Profissional criado!' });
      }
      setShowNewProfessional(false);
      resetProfForm();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const toggleProfessionalActive = async (prof: Professional) => {
    if (!prof.active && !canAddProfessional) {
      toast({ 
        variant: 'destructive', 
        title: 'Limite atingido', 
        description: 'Desative outro profissional ou atualize seu plano.' 
      });
      return;
    }
    
    try {
      await updateProfessional.mutateAsync({
        id: prof.id,
        active: !prof.active,
      });
      toast({ title: prof.active ? 'Profissional desativado' : 'Profissional ativado' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleDeleteProfessional = async () => {
    if (!deletingProfessional) return;
    try {
      await deleteProfessional.mutateAsync(deletingProfessional.id);
      toast({ title: 'Profissional removido!' });
      setDeletingProfessional(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
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
      setCurrentPassword('');
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="salon">
              <Building2 className="h-4 w-4 mr-2" />
              Salão
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="blocks">
              Bloqueios
            </TabsTrigger>
          </TabsList>

          {/* Salon Tab */}
          <TabsContent value="salon" className="space-y-4 mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Dados do Salão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        {activeProfessionalsCount} de {maxProfessionals} profissionais
                      </div>
                    </div>
                    <Badge variant={activeProfessionalsCount >= maxProfessionals ? "destructive" : "secondary"}>
                      {activeProfessionalsCount >= maxProfessionals ? 'Limite atingido' : 'Ativo'}
                    </Badge>
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

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
            {/* Invite Button */}
            {isAdmin && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowInvite(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Convidar Profissional
              </Button>
            )}

            {/* Limit warning */}
            {!canAddProfessional && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <p className="text-sm text-orange-800">
                    Limite de {maxProfessionals} profissionais atingido. 
                    <Button variant="link" className="p-0 h-auto text-orange-800 underline ml-1">
                      Atualize seu plano
                    </Button>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Professionals list */}
            {professionals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum profissional cadastrado
              </div>
            ) : (
              <div className="space-y-3">
                {professionals.map((prof) => (
                  <Card key={prof.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(prof.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{prof.display_name}</span>
                            {!prof.active && (
                              <Badge variant="secondary" className="text-xs">Inativo</Badge>
                            )}
                          </div>
                          {isAdmin && prof.user_email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{prof.user_email}</span>
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Comissão: {prof.commission_percent_default}%
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={prof.active}
                              onCheckedChange={() => toggleProfessionalActive(prof)}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setCommissionsForProfessional(prof)}
                              title="Comissões por serviço"
                            >
                              <Scissors className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditProfessional(prof)}
                              title="Editar profissional"
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeletingProfessional(prof)}
                              title="Remover profissional"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* New/Edit Professional Sheet */}
            <Sheet open={showNewProfessional} onOpenChange={(open) => {
              setShowNewProfessional(open);
              if (!open) resetProfForm();
            }}>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>
                    {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
                  </SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      placeholder="Nome do profissional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comissão padrão (%)</Label>
                    <Input
                      value={profCommission}
                      onChange={(e) => setProfCommission(e.target.value)}
                      type="number"
                      min="0"
                      max="100"
                      placeholder="40"
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentual padrão de comissão sobre os atendimentos
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSaveProfessional}
                    disabled={createProfessional.isPending || updateProfessional.isPending}
                  >
                    {(createProfessional.isPending || updateProfessional.isPending) 
                      ? 'Salvando...' 
                      : 'Salvar'
                    }
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* FAB */}
            {isAdmin && canAddProfessional && (
              <Button
                size="lg"
                className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
                onClick={() => setShowNewProfessional(true)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            )}
          </TabsContent>

          {/* Blocks Tab */}
          <TabsContent value="blocks" className="space-y-4 mt-4">
            <TimeBlockManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Professional Commissions Sheet */}
      {commissionsForProfessional && (
        <ProfessionalCommissions 
          professional={commissionsForProfessional} 
          onClose={() => setCommissionsForProfessional(null)} 
        />
      )}

      {/* Invite Professional Sheet */}
      <InviteProfessional 
        open={showInvite} 
        onClose={() => setShowInvite(false)} 
      />

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProfessional} onOpenChange={(open) => !open && setDeletingProfessional(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover profissional?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingProfessional?.display_name}</strong> da equipe? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProfessional}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProfessional.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
