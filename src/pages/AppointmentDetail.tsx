import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Clock, User, Scissors, DollarSign, Phone, CheckCircle, XCircle, Package, History, Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAppointment, useUpdateAppointmentStatus, useAddAppointmentService, useRemoveAppointmentService } from '@/hooks/useAppointments';
import { useCompleteAppointment } from '@/hooks/useCommissions';
import { useServiceCommissions } from '@/hooks/useServiceCommissions';
import { useAppointmentLogs, formatLogAction } from '@/hooks/useAppointmentLogs';
import { useActiveServices } from '@/hooks/useServices';
import { PaymentMethod, CardFeesByInstallment } from '@/types/database';
import { ProductSelector, SelectedProduct } from '@/components/ProductSelector';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels = {
  confirmed: { label: 'Confirmado', color: 'bg-primary' },
  completed: { label: 'Concluído', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-muted' },
};

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'other', label: 'Outro' },
];

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { salon } = useAuth();
  
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState<number>(1);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedServicesToAdd, setSelectedServicesToAdd] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');

  const { data: appointment, isLoading } = useAppointment(id);
  const { data: logs = [] } = useAppointmentLogs(id);
  const { data: availableServices = [] } = useActiveServices();
  const updateStatus = useUpdateAppointmentStatus();
  const completeAppointment = useCompleteAppointment();
  const addService = useAddAppointmentService();
  const removeService = useRemoveAppointmentService();
  const { data: serviceCommissions = [] } = useServiceCommissions(appointment?.professional_id);

  // Get fee percentages from salon
  const cardFeesByInstallment = (salon as any)?.card_fees_by_installment as CardFeesByInstallment || {};
  const adminFeePercent = (salon as any)?.admin_fee_percent || 0;

  // Calculate commission based on service-specific rules or default
  const { commissionAmount, commissionDetails, grossCommission, cardFeeAmount, adminFeeAmount, cardFeePercent } = useMemo(() => {
    if (!appointment) return { commissionAmount: 0, commissionDetails: [], grossCommission: 0, cardFeeAmount: 0, adminFeeAmount: 0, cardFeePercent: 0 };
    
    const defaultPercent = appointment.professional?.commission_percent_default || 0;
    const details: { serviceName: string; amount: number; rule: string }[] = [];
    let total = 0;

    appointment.appointment_services?.forEach((as) => {
      const customRule = serviceCommissions.find(sc => sc.service_id === as.service_id);
      const priceCharged = Number(as.price_charged);
      
      let commission = 0;
      let rule = '';
      
      if (customRule) {
        if (customRule.type === 'percent') {
          commission = (priceCharged * customRule.value) / 100;
          rule = `${customRule.value}%`;
        } else {
          commission = customRule.value;
          rule = `R$ ${customRule.value.toFixed(2)} fixo`;
        }
      } else {
        commission = (priceCharged * defaultPercent) / 100;
        rule = `${defaultPercent}% (padrão)`;
      }
      
      details.push({
        serviceName: as.service?.name || 'Serviço',
        amount: commission,
        rule,
      });
      total += commission;
    });

    // Calculate fee deductions based on payment method and installments
    const isCardPayment = paymentMethod === 'credit_card';
    const currentCardFeePercent = isCardPayment ? (cardFeesByInstallment[String(installments)] || 0) : 0;
    const cardFee = (total * currentCardFeePercent) / 100;
    const adminFee = (total * adminFeePercent) / 100;
    const netCommission = total - cardFee - adminFee;

    return { 
      commissionAmount: netCommission, 
      commissionDetails: details,
      grossCommission: total,
      cardFeeAmount: cardFee,
      adminFeeAmount: adminFee,
      cardFeePercent: currentCardFeePercent
    };
  }, [appointment, serviceCommissions, paymentMethod, installments, cardFeesByInstallment, adminFeePercent]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!appointment) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Agendamento não encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/agenda')}>
            Voltar para Agenda
          </Button>
        </div>
      </AppLayout>
    );
  }

  const commissionPercent = appointment.professional?.commission_percent_default || 0;

  const productsTotal = selectedProducts.reduce(
    (acc, sp) => acc + sp.product.price * sp.quantity,
    0
  );
  
  const grandTotal = Number(appointment.total_amount) + productsTotal;

  const handleComplete = async () => {
    try {
      await completeAppointment.mutateAsync({
        appointmentId: appointment.id,
        paymentMethod,
        amount: Number(appointment.total_amount),
        professionalId: appointment.professional_id,
        commissionAmount,
        grossCommissionAmount: grossCommission,
        cardFeeAmount,
        adminFeeAmount,
        productSales: selectedProducts.map(sp => ({
          productId: sp.product.id,
          quantity: sp.quantity,
          price: sp.product.price,
          name: sp.product.name,
        })),
      });
      setShowCompleteDialog(false);
      setSelectedProducts([]);
      toast({ title: 'Atendimento concluído!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleCancel = async () => {
    try {
      await updateStatus.mutateAsync({
        id: appointment.id,
        status: 'cancelled',
        cancelled_reason: cancelReason,
      });
      setShowCancelDialog(false);
      toast({ title: 'Atendimento cancelado' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleAddServices = async () => {
    if (selectedServicesToAdd.length === 0) return;
    
    try {
      for (const serviceId of selectedServicesToAdd) {
        const serviceData = availableServices.find(s => s.id === serviceId);
        if (serviceData) {
          await addService.mutateAsync({
            appointmentId: appointment.id,
            service: {
              service_id: serviceId,
              price_charged: serviceData.price,
              duration_minutes: serviceData.duration_minutes,
            },
          });
        }
      }
      setShowAddServiceDialog(false);
      setSelectedServicesToAdd([]);
      setServiceSearch('');
      toast({ title: 'Serviço(s) adicionado(s) com sucesso!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const handleRemoveService = async (appointmentServiceId: string, priceCharged: number, durationMinutes: number) => {
    if ((appointment.appointment_services?.length || 0) <= 1) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O agendamento precisa ter pelo menos um serviço.' });
      return;
    }
    
    try {
      await removeService.mutateAsync({
        appointmentId: appointment.id,
        appointmentServiceId,
        priceCharged,
        durationMinutes,
      });
      toast({ title: 'Serviço removido' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  // Filter services that are not already in the appointment
  const existingServiceIds = new Set(appointment?.appointment_services?.map(as => as.service_id) || []);
  const filteredServices = availableServices.filter(s => 
    !existingServiceIds.has(s.id) &&
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Detalhes do Agendamento</h1>
          </div>
          <Badge className={statusLabels[appointment.status].color}>
            {statusLabels[appointment.status].label}
          </Badge>
        </div>

        {/* Date & Time */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                <span className="text-xs text-primary font-medium">
                  {format(new Date(appointment.start_at), 'MMM', { locale: ptBR }).toUpperCase()}
                </span>
                <span className="text-xl font-bold text-primary">
                  {format(new Date(appointment.start_at), 'd')}
                </span>
              </div>
              <div>
                <div className="font-semibold text-lg">
                  {format(new Date(appointment.start_at), "EEEE", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(appointment.start_at), 'HH:mm')} - {format(new Date(appointment.end_at), 'HH:mm')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & Professional */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cliente</div>
                <div className="font-medium">
                  {appointment.client?.full_name || 'Não informado'}
                </div>
              </div>
              {appointment.client?.phone && (
                <Button variant="ghost" size="icon" className="ml-auto">
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Profissional</div>
                <div className="font-medium">{appointment.professional?.display_name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Serviços</h3>
              {appointment.status === 'confirmed' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddServiceDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {appointment.appointment_services?.map((as) => (
                <div key={as.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-medium">{as.service?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {as.duration_minutes || as.service?.duration_minutes}min
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      R$ {Number(as.price_charged).toFixed(2)}
                    </span>
                    {appointment.status === 'confirmed' && (appointment.appointment_services?.length || 0) > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveService(
                          as.id, 
                          Number(as.price_charged), 
                          as.duration_minutes || as.service?.duration_minutes || 30
                        )}
                        disabled={removeService.isPending}
                      >
                        {removeService.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-primary text-lg">
                R$ {Number(appointment.total_amount).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {appointment.notes && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-muted-foreground">{appointment.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Activity Log */}
        {logs.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Alterações
              </h3>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-1">
                        <span className="font-medium">{log.user_name}</span>
                        <span className="text-muted-foreground">{formatLogAction(log.action)}</span>
                      </div>
                      {log.changes?.cancelled_reason && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Motivo: {log.changes.cancelled_reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {appointment.status === 'confirmed' && (
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              className="flex-1"
              onClick={() => setShowCompleteDialog(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </div>
        )}

        {/* Complete Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={(open) => {
          setShowCompleteDialog(open);
          if (!open) setSelectedProducts([]);
        }}>
          <DialogContent className="max-w-md max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Concluir Atendimento</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={(v) => {
                    setPaymentMethod(v as PaymentMethod);
                    if (v !== 'credit_card') setInstallments(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-2">
                    <Label>Parcelas</Label>
                    <Select value={String(installments)} onValueChange={(v) => setInstallments(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                          const feePercent = cardFeesByInstallment[String(num)] || 0;
                          return (
                            <SelectItem key={num} value={String(num)}>
                              {num}x {feePercent > 0 ? `(taxa: ${feePercent}%)` : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Product Selector */}
                <ProductSelector 
                  selectedProducts={selectedProducts}
                  onProductsChange={setSelectedProducts}
                />

                <Separator />

                {/* Summary */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Serviços</span>
                    <span className="font-semibold">R$ {Number(appointment.total_amount).toFixed(2)}</span>
                  </div>
                  
                  {productsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Produtos ({selectedProducts.length})
                      </span>
                      <span className="font-semibold">R$ {productsTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold border-t border-border pt-2">
                    <span>Total a Pagar</span>
                    <span className="text-primary text-lg">R$ {grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-border my-2 pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Comissões por serviço:</p>
                    {commissionDetails.map((detail, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                        <span>{detail.serviceName} ({detail.rule})</span>
                        <span>R$ {detail.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Comissão bruta</span>
                    <span>R$ {grossCommission.toFixed(2)}</span>
                  </div>
                  
                  {(cardFeeAmount > 0 || adminFeeAmount > 0) && (
                    <div className="space-y-1 pl-3 border-l-2 border-destructive/30">
                      {cardFeeAmount > 0 && (
                        <div className="flex justify-between text-xs text-destructive">
                          <span>(-) Taxa cartão {installments}x ({cardFeePercent}%)</span>
                          <span>- R$ {cardFeeAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {adminFeeAmount > 0 && (
                        <div className="flex justify-between text-xs text-destructive">
                          <span>(-) Taxa admin ({adminFeePercent}%)</span>
                          <span>- R$ {adminFeeAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold border-t border-border pt-2">
                    <span>Comissão líquida</span>
                    <span className="text-primary">R$ {commissionAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleComplete} disabled={completeAppointment.isPending}>
                {completeAppointment.isPending ? 'Concluindo...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Atendimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Motivo do cancelamento</Label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Cliente desmarcou"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? 'Cancelando...' : 'Cancelar Atendimento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Service Dialog */}
        <Dialog open={showAddServiceDialog} onOpenChange={(open) => {
          setShowAddServiceDialog(open);
          if (!open) {
            setSelectedServicesToAdd([]);
            setServiceSearch('');
          }
        }}>
          <DialogContent className="max-w-md max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Adicionar Serviços</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Buscar serviço..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
              />
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {filteredServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {serviceSearch ? 'Nenhum serviço encontrado' : 'Todos os serviços já foram adicionados'}
                    </p>
                  ) : (
                    filteredServices.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedServicesToAdd.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServicesToAdd(prev => [...prev, service.id]);
                            } else {
                              setSelectedServicesToAdd(prev => prev.filter(id => id !== service.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.duration_minutes}min
                          </div>
                        </div>
                        <div className="font-semibold">
                          R$ {service.price.toFixed(2)}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
              {selectedServicesToAdd.length > 0 && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{selectedServicesToAdd.length} serviço(s) selecionado(s)</span>
                    <span className="font-semibold">
                      + R$ {selectedServicesToAdd
                        .map(id => availableServices.find(s => s.id === id)?.price || 0)
                        .reduce((a, b) => a + b, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddServiceDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddServices} 
                disabled={selectedServicesToAdd.length === 0 || addService.isPending}
              >
                {addService.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
