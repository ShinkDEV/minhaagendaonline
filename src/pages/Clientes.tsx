import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ChevronRight, Calendar, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { useTrialBlock } from '@/hooks/useTrialBlock';
import { cn } from '@/lib/utils';

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientBirthDate, setNewClientBirthDate] = useState('');
  const [newClientGender, setNewClientGender] = useState('');
  const [newClientCpf, setNewClientCpf] = useState('');
  const [newClientRg, setNewClientRg] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trialCancelled, blockAction } = useTrialBlock();

  const { data: clients = [], isLoading } = useClients(search);
  const createClient = useCreateClient();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCreateClient = async () => {
    if (blockAction()) return;
    
    if (!newClientName.trim()) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }
    try {
      await createClient.mutateAsync({
        full_name: newClientName,
        phone: newClientPhone || undefined,
        email: newClientEmail || undefined,
        birth_date: newClientBirthDate || undefined,
        gender: newClientGender || undefined,
        cpf: newClientCpf.replace(/\D/g, '') || undefined,
        rg: newClientRg || undefined,
      });
      setShowNewClient(false);
      resetForm();
      toast({ title: 'Cliente criado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientBirthDate('');
    setNewClientGender('');
    setNewClientCpf('');
    setNewClientRg('');
  };

  return (
    <AppLayout title="Clientes">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => (
              <Card 
                key={client.id} 
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {client.avatar_url && (
                        <AvatarImage src={client.avatar_url} alt={client.full_name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(client.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{client.full_name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        {client.phone && <span>{client.phone}</span>}
                        {client.phone && client.appointment_count > 0 && <span>•</span>}
                        {client.appointment_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {client.appointment_count}
                          </span>
                        )}
                        {client.credit_balance !== 0 && (
                          <>
                            <span>•</span>
                            <span className={cn(
                              "flex items-center gap-1",
                              client.credit_balance >= 0 ? "text-green-600" : "text-destructive"
                            )}>
                              <Wallet className="h-3 w-3" />
                              R$ {client.credit_balance.toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* New Client Sheet */}
        <Sheet open={showNewClient} onOpenChange={setShowNewClient}>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo Cliente</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={newClientBirthDate}
                    onChange={(e) => setNewClientBirthDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select value={newClientGender} onValueChange={setNewClientGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                      <SelectItem value="prefer_not_say">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={newClientCpf}
                    onChange={(e) => setNewClientCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RG</Label>
                  <Input
                    value={newClientRg}
                    onChange={(e) => setNewClientRg(e.target.value)}
                    placeholder="00.000.000-0"
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateClient}
                disabled={createClient.isPending}
              >
                {createClient.isPending ? 'Criando...' : 'Criar Cliente'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* FAB */}
        {!trialCancelled && (
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowNewClient(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
