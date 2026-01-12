import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Printer, Download, X } from 'lucide-react';
import { Commission } from '@/types/database';

interface CommissionReceiptProps {
  commission: Commission | null;
  salonName: string;
  open: boolean;
  onClose: () => void;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  other: 'Outro',
};

export function CommissionReceipt({ commission, salonName, open, onClose }: CommissionReceiptProps) {
  if (!commission) return null;

  const professional = commission.professional;
  const appointment = commission.appointment;
  const client = appointment?.client;

  const grossAmount = commission.gross_amount || commission.amount;
  const cardFee = commission.card_fee_amount || 0;
  const adminFee = commission.admin_fee_amount || 0;
  const netAmount = commission.amount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md print:shadow-none print:border-0">
        <DialogHeader className="print:hidden">
          <DialogTitle>Recibo de Comissão</DialogTitle>
        </DialogHeader>

        {/* Receipt Content */}
        <div className="space-y-4 text-sm print:text-black">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold">{salonName}</h2>
            <p className="text-muted-foreground print:text-gray-600">Recibo de Comissão</p>
            <p className="text-xs text-muted-foreground print:text-gray-500 mt-1">
              Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>

          {/* Professional Info */}
          <div className="space-y-1">
            <p className="font-medium">Profissional</p>
            <p className="text-muted-foreground print:text-gray-600">
              {professional?.display_name}
            </p>
            {professional?.cpf && (
              <p className="text-xs text-muted-foreground print:text-gray-500">
                CPF: {professional.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              </p>
            )}
          </div>

          <Separator />

          {/* Appointment Info */}
          <div className="space-y-1">
            <p className="font-medium">Atendimento</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground print:text-gray-500">Data:</span>
                <span className="ml-1">
                  {appointment?.start_at 
                    ? format(new Date(appointment.start_at), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'
                  }
                </span>
              </div>
              <div>
                <span className="text-muted-foreground print:text-gray-500">Horário:</span>
                <span className="ml-1">
                  {appointment?.start_at 
                    ? format(new Date(appointment.start_at), 'HH:mm', { locale: ptBR })
                    : '-'
                  }
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground print:text-gray-500">Cliente:</span>
                <span className="ml-1">{client?.full_name || 'Não informado'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground print:text-gray-500">Forma de pagamento:</span>
                <span className="ml-1">
                  {commission.payment_method 
                    ? paymentMethodLabels[commission.payment_method] || commission.payment_method
                    : 'Não informado'
                  }
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Commission Details */}
          <div className="space-y-2">
            <p className="font-medium">Detalhamento da Comissão</p>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Valor do atendimento</span>
                <span>R$ {(appointment?.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground print:text-gray-600">
                <span>Comissão bruta</span>
                <span>R$ {grossAmount.toFixed(2)}</span>
              </div>
            </div>

            {(cardFee > 0 || adminFee > 0) && (
              <div className="space-y-1 pl-4 border-l-2 border-muted">
                {cardFee > 0 && (
                  <div className="flex justify-between text-xs text-destructive">
                    <span>(-) Taxa de cartão</span>
                    <span>- R$ {cardFee.toFixed(2)}</span>
                  </div>
                )}
                {adminFee > 0 && (
                  <div className="flex justify-between text-xs text-destructive">
                    <span>(-) Taxa administrativa</span>
                    <span>- R$ {adminFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>Comissão líquida</span>
              <span className="text-primary print:text-black">R$ {netAmount.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground print:text-gray-500">Status</span>
            <span className={commission.status === 'paid' ? 'text-green-600' : 'text-amber-600'}>
              {commission.status === 'paid' ? '✓ PAGO' : '⏳ PENDENTE'}
            </span>
          </div>

          {commission.status === 'paid' && commission.paid_at && (
            <div className="text-xs text-center text-muted-foreground print:text-gray-500">
              Pago em {format(new Date(commission.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground print:text-gray-500 pt-4 border-t">
            <p>Documento gerado automaticamente pelo sistema</p>
            <p className="font-mono mt-1">ID: {commission.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 print:hidden">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Fechar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
