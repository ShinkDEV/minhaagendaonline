import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Mail, Link2, Copy, Check, X, Clock, UserPlus, Trash2 } from 'lucide-react';
import { useInvitations, useCreateInvitation, useCancelInvitation, Invitation } from '@/hooks/useInvitations';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteProfessional({ open, onClose }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useInvitations();
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();

  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  const handleSendInvite = async () => {
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Digite um email' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ variant: 'destructive', title: 'Email inválido' });
      return;
    }

    try {
      await createInvitation.mutateAsync(email);
      toast({ title: 'Convite enviado!', description: 'O profissional receberá um email com o link de convite' });
      setEmail('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleCopyLink = (invitation: Invitation) => {
    const link = `${window.location.origin}/invite/${invitation.token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(invitation.token);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelInvitation.mutateAsync(id);
      toast({ title: 'Convite cancelado' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const getStatusBadge = (invitation: Invitation) => {
    const isExpired = new Date(invitation.expires_at) < new Date();
    
    if (invitation.status === 'accepted') {
      return <Badge variant="default" className="bg-green-500">Aceito</Badge>;
    }
    if (invitation.status === 'cancelled') {
      return <Badge variant="secondary">Cancelado</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    return <Badge variant="outline" className="border-orange-500 text-orange-600">Pendente</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Profissional
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Create Invitation */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Novo Convite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email do profissional</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSendInvite}
                disabled={createInvitation.isPending}
              >
                {createInvitation.isPending ? 'Criando...' : 'Criar Convite'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                O convite expira em 7 dias. Após criar, copie o link e envie para o profissional.
              </p>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Convites Pendentes ({pendingInvitations.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Carregando...</div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum convite pendente</p>
              </div>
            ) : (
              pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium truncate">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Expira em {format(new Date(invitation.expires_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invitation)}
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleCopyLink(invitation)}
                          title="Copiar link"
                        >
                          {copiedToken === invitation.token ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleCancel(invitation.id)}
                          title="Cancelar convite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* All Invitations History */}
          {invitations.filter(i => i.status !== 'pending').length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-muted-foreground">Histórico</h3>
              {invitations.filter(i => i.status !== 'pending').slice(0, 5).map((invitation) => (
                <Card key={invitation.id} className="border-0 shadow-sm opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invitation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {getStatusBadge(invitation)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
