import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProfessionals, useCreateProfessional, useUpdateProfessional } from '@/hooks/useProfessionals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, User, CreditCard, Shield, Mail, Percent, Building2, KeyRound } from 'lucide-react';
import { Professional } from '@/types/database';

const formatCpf = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export default function Profissionais() {
  const { toast } = useToast();
  const { data: professionals = [], isLoading } = useProfessionals(true);
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cpf, setCpf] = useState('');
  const [position, setPosition] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('0');
  const [bankName, setBankName] = useState('');
  const [bankAgency, setBankAgency] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('');
  const [canDeleteAppointments, setCanDeleteAppointments] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setDisplayName('');
    setLegalName('');
    setCpf('');
    setPosition('');
    setCommissionPercent('0');
    setBankName('');
    setBankAgency('');
    setBankAccount('');
    setPixKey('');
    setPixKeyType('');
    setCanDeleteAppointments(false);
    setIsActive(true);
    setActiveTab('info');
  };

  const openNewProfessional = () => {
    resetForm();
    setSelectedProfessional(null);
    setIsSheetOpen(true);
  };

  const openEditProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
    setDisplayName(professional.display_name);
    setLegalName(professional.legal_name || '');
    setCpf(professional.cpf || '');
    setPosition(professional.position || '');
    setCommissionPercent(String(professional.commission_percent_default || 0));
    setBankName(professional.bank_name || '');
    setBankAgency(professional.bank_agency || '');
    setBankAccount(professional.bank_account || '');
    setPixKey(professional.pix_key || '');
    setPixKeyType(professional.pix_key_type || '');
    setCanDeleteAppointments(professional.can_delete_appointments || false);
    setIsActive(professional.active);
    setActiveTab('info');
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: 'Nome social é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      if (selectedProfessional) {
        await updateProfessional.mutateAsync({
          id: selectedProfessional.id,
          display_name: displayName.trim(),
          legal_name: legalName.trim() || null,
          cpf: cpf.replace(/\D/g, '') || null,
          position: position.trim() || null,
          commission_percent_default: parseFloat(commissionPercent) || 0,
          bank_name: bankName.trim() || null,
          bank_agency: bankAgency.trim() || null,
          bank_account: bankAccount.trim() || null,
          pix_key: pixKey.trim() || null,
          pix_key_type: pixKeyType || null,
          can_delete_appointments: canDeleteAppointments,
          active: isActive,
        });
        toast({ title: 'Profissional atualizado!' });
      } else {
        await createProfessional.mutateAsync({
          display_name: displayName.trim(),
          commission_percent_default: parseFloat(commissionPercent) || 0,
        });
        toast({ title: 'Profissional cadastrado!' });
      }
      setIsSheetOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  const activeProfessionals = professionals.filter(p => p.active);
  const inactiveProfessionals = professionals.filter(p => !p.active);

  return (
    <AppLayout title="Profissionais">
      <div className="p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Equipe</h2>
            <p className="text-sm text-muted-foreground">
              {activeProfessionals.length} ativo{activeProfessionals.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={openNewProfessional} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Professionals */}
            {activeProfessionals.map(prof => (
              <Card 
                key={prof.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openEditProfessional(prof)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{prof.display_name}</p>
                        {prof.position && (
                          <p className="text-sm text-muted-foreground">{prof.position}</p>
                        )}
                        {prof.cpf && (
                          <p className="text-xs text-muted-foreground">CPF: {formatCpf(prof.cpf)}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        <Percent className="h-3 w-3 mr-1" />
                        {prof.commission_percent_default}%
                      </Badge>
                      {prof.can_delete_appointments && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Shield className="h-3 w-3" />
                          <span>Admin</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(prof as any).user_email && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{(prof as any).user_email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Inactive Professionals */}
            {inactiveProfessionals.length > 0 && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">Inativos</p>
                {inactiveProfessionals.map(prof => (
                  <Card 
                    key={prof.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors opacity-60"
                    onClick={() => openEditProfessional(prof)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{prof.display_name}</p>
                            {prof.position && (
                              <p className="text-sm text-muted-foreground">{prof.position}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">Inativo</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {professionals.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhum profissional cadastrado</p>
                  <Button onClick={openNewProfessional} className="mt-4">
                    <Plus className="h-4 w-4 mr-1" />
                    Cadastrar profissional
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedProfessional ? 'Editar Profissional' : 'Novo Profissional'}
            </SheetTitle>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Dados</TabsTrigger>
              <TabsTrigger value="bank">Banco</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome Social *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nome de exibição"
                />
                <p className="text-xs text-muted-foreground">
                  Nome que será exibido no sistema
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">Nome Conforme Documento</Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Nome completo conforme RG"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Ex: Cabeleireira, Manicure, Esteticista"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Comissão Padrão (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                />
              </div>

              {selectedProfessional && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Profissional ativo</p>
                    <p className="text-xs text-muted-foreground">
                      Desativar remove da agenda
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              )}
            </TabsContent>

            {/* Bank Info Tab */}
            <TabsContent value="bank" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Dados Bancários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Banco</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Nome do banco"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="bankAgency">Agência</Label>
                      <Input
                        id="bankAgency"
                        value={bankAgency}
                        onChange={(e) => setBankAgency(e.target.value)}
                        placeholder="0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Conta</Label>
                      <Input
                        id="bankAccount"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        placeholder="00000-0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Chave PIX
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pixKeyType">Tipo de Chave</Label>
                    <Select value={pixKeyType} onValueChange={setPixKeyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="random">Chave aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Digite a chave PIX"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permissões Especiais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Excluir Agendamentos</p>
                      <p className="text-xs text-muted-foreground">
                        Permite excluir agendamentos próprios
                      </p>
                    </div>
                    <Switch
                      checked={canDeleteAppointments}
                      onCheckedChange={setCanDeleteAppointments}
                    />
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ Atenção: Profissionais com esta permissão podem remover agendamentos do sistema.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {(selectedProfessional as any)?.user_email && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Acesso ao Sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{(selectedProfessional as any).user_email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Este profissional possui acesso ao sistema com este e-mail.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsSheetOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              onClick={handleSave}
              disabled={createProfessional.isPending || updateProfessional.isPending}
            >
              {createProfessional.isPending || updateProfessional.isPending
                ? 'Salvando...'
                : 'Salvar'
              }
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
