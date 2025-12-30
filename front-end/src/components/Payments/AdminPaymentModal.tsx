import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approvePayment, rejectPayment } from '@/api/models/payments';
import { toast } from 'react-toastify';

interface AdminPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    userName: string;
    userEmail: string;
    planId: string;
    amount: number;
    status: string;
    proofUrl: string | null;
    proofUploadedAt: string | null;
    approvedAt: string | null;
    approvedByAdminName: string | null;
    rejectedAt: string | null;
    createdAt: string;
  };
}

export default function AdminPaymentModal({
  isOpen,
  onClose,
  payment,
}: AdminPaymentModalProps) {
  const queryClient = useQueryClient();

  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      await approvePayment(payment.id);
    },
    onSuccess: () => {
      toast.success('Pagamento aprovado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao aprovar pagamento');
    },
  });

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: async () => {
      await rejectPayment(payment.id);
    },
    onSuccess: () => {
      toast.success('Pagamento rejeitado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao rejeitar pagamento');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      PENDING: { label: 'Pendente', variant: 'secondary' },
      PROOF_UPLOADED: { label: 'Comprovante Enviado', variant: 'outline' },
      APPROVED: { label: 'Aprovado', variant: 'default' },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' },
      CANCELED: { label: 'Cancelado', variant: 'secondary' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canApprove = payment.status === 'PROOF_UPLOADED';
  const canReject = payment.status === 'PROOF_UPLOADED' || payment.status === 'PENDING';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Pagamento #{payment.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações do Usuário */}
            <div className="space-y-2">
              <h3 className="font-semibold">Informações do Usuário</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-medium">{payment.userName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{payment.userEmail}</p>
                </div>
              </div>
            </div>

            {/* Informações do Pagamento */}
            <div className="space-y-2">
              <h3 className="font-semibold">Informações do Pagamento</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Plano</p>
                  <p className="font-medium">{payment.planId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h3 className="font-semibold">Histórico</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium">Pagamento Iniciado</p>
                    <p className="text-muted-foreground">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {payment.proofUploadedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Comprovante Enviado</p>
                      <p className="text-muted-foreground">
                        {format(new Date(payment.proofUploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}

                {payment.approvedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Pagamento Aprovado</p>
                      <p className="text-muted-foreground">
                        {format(new Date(payment.approvedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                      {payment.approvedByAdminName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Aprovado por: {payment.approvedByAdminName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {payment.rejectedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium">Pagamento Rejeitado</p>
                      <p className="text-muted-foreground">
                        {format(new Date(payment.rejectedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comprovante */}
            {payment.proofUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold">Comprovante</h3>
                <Button
                  variant="outline"
                  onClick={() => window.open(payment.proofUrl, '_blank')}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Comprovante
                </Button>
              </div>
            )}

            {/* Ações */}
            {(canApprove || canReject) && (
              <div className="flex gap-2 pt-4 border-t">
                {canReject && (
                  <Button
                    variant="destructive"
                    onClick={() => reject()}
                    disabled={isRejecting || isApproving}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                )}
                {canApprove && (
                  <Button
                    onClick={() => approve()}
                    disabled={isApproving || isRejecting}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
