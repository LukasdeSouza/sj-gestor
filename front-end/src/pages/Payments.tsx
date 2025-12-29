import { useQuery } from '@tanstack/react-query';
import { getUserPayment } from '@/api/models/payments';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Download } from 'lucide-react';
import { useState } from 'react';

export default function Payments() {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', 'me'],
    queryFn: async () => {
      try {
        return await getUserPayment();
      } catch {
        return null;
      }
    },
    retry: 0,
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">Carregando pagamentos...</div>
      </DashboardLayout>
    );
  }

  if (!payment) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
              <CardDescription>Você ainda não tem nenhum pagamento registrado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Selecione um plano na página de Planos para começar.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Pagamentos</h1>
          <p className="text-muted-foreground">Acompanhe o status de seus pagamentos</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pagamento #{payment.id.substring(0, 8)}</CardTitle>
                <CardDescription>
                  Criado em {format(new Date(payment.createdAt || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </CardDescription>
              </div>
              {getStatusBadge(payment.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Detalhes do Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-medium">{payment.planId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium">
                  {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 mt-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-0.5 h-12 bg-gray-200"></div>
                </div>
                <div>
                  <p className="font-medium">Pagamento Iniciado</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.createdAt || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>

              {payment.proofUploadedAt && (
                <>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="w-0.5 h-12 bg-gray-200"></div>
                    </div>
                    <div>
                      <p className="font-medium">Comprovante Enviado</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.proofUploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                      {payment.proofUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => setSelectedProof(payment.proofUrl)}
                          className="mt-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar Comprovante
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {payment.approvedAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium">Pagamento Aprovado</p>
                    <p className="text-sm text-muted-foreground">
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
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium">Pagamento Rejeitado</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.rejectedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você pode enviar um novo comprovante
                    </p>
                  </div>
                </div>
              )}

              {payment.canceledAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-medium">Pagamento Cancelado</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.canceledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proof Preview Modal */}
        {selectedProof && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-950 rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Comprovante de Pagamento</h2>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              {selectedProof.endsWith('.pdf') ? (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-4">Arquivo PDF</p>
                  <a
                    href={selectedProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </a>
                </div>
              ) : (
                <img src={selectedProof} alt="Comprovante" className="w-full rounded-lg" />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
