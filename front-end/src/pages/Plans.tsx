import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import LogoutButton from "@/components/LogoutButton";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import PixPaymentModal from "@/components/Subscription/PixPaymentModal";
import ProofUploadForm from "@/components/Subscription/ProofUploadForm";
import { selectPixPlan, getUserPayment } from "@/api/models/payments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Download, Clock } from "lucide-react";

type Plan = {
  id: "FREE" | "PRO_100" | "PRO_UNLIMITED";
  name: string;
  price: number;
  clientLimit: number | null;
  description: string;
};

export default function Plans() {
  const queryClient = useQueryClient();
  const [showPixModal, setShowPixModal] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => await fetchUseQuery<undefined, Plan[]>({ route: "/plans", method: "GET" }),
    retry: 1,
  });

  const { data: subscription } = useQuery<{ 
    id: string;
    status: string; 
    plan_id: Plan["id"] | null; 
    activatedAt?: string; 
    payment_status?: string;
    proof_uploaded_at?: string | null;
    approved_at?: string | null;
    pix_qr_code?: string | null;
  }>({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { 
      id: string;
      status: string; 
      plan_id: Plan["id"] | null; 
      activatedAt?: string; 
      payment_status?: string;
      proof_uploaded_at?: string | null;
      approved_at?: string | null;
      pix_qr_code?: string | null;
    }>({ route: "/subscription/me", method: "GET" }),
    retry: 0,
  });

  const { data: userPayment } = useQuery({
    queryKey: ["payment", "me"],
    queryFn: async () => {
      try {
        return await getUserPayment();
      } catch {
        return null;
      }
    },
    retry: 0,
  });

  // Stripe mutation
  const { mutate: createPreference, isPending: isCreatingPreference } = useMutation({
    mutationFn: async (planId: Plan["id"]) => {
      const res = await fetchUseQuery<{ planId: Plan["id"] }, any>({
        route: "/preferences",
        method: "POST",
        data: { planId },
      });
      return res;
    },
    onSuccess: async (res: any) => {
      const url = res?.url || res?.initPoint || res?.init_point;
      const plan = res?.plan;

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (plan && (plan.id === "FREE" || Number(plan.price) === 0)) {
        toast.success("Plano gratuito ativado com sucesso");
        await queryClient.invalidateQueries({ queryKey: ["subscription", "me" ] });
        return;
      }

      toast.error("Não foi possível iniciar o checkout");
    },
    onError: (err: ApiErrorQuery) => {
      toast.error(err.message || "Erro ao criar preferência");
    },
  });

  // PIX mutation
  const { mutate: selectPix, isPending: isSelectingPix } = useMutation({
    mutationFn: async (planId: Plan["id"]) => {
      return await selectPixPlan(planId);
    },
    onSuccess: (data) => {
      console.log('data', data)
      setPixPaymentData(data);
      setShowPixModal(true);
    },
    onError: (err: ApiErrorQuery) => {
      toast.error(err.message || "Erro ao selecionar plano PIX");
    },
  });

  const handlePaymentMethodSelect = (plan: Plan, method: "stripe" | "pix") => {
    setSelectedPlan(plan);
    if (method === "stripe") {
      createPreference(plan.id);
    } else {
      selectPix(plan.id);
    }
  };

  const handlePixPaymentConfirmed = () => {
    setShowPixModal(false);
    setShowProofForm(true);
  };

  const handleProofUploadSuccess = () => {
    setShowProofForm(false);
    toast.success("Comprovante enviado! Aguarde aprovação do administrador.");
    queryClient.invalidateQueries({ queryKey: ["payment", "me"] });
  };

  const handleUploadProofClick = () => {
    if (subscription?.id) {
      setPixPaymentData({ subscriptionId: subscription.id });
      setShowProofForm(true);
    }
  };

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

  if (isLoading) return <div className="p-6">Carregando planos...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Assinatura</h1>
            <p className="text-muted-foreground">Gerencie seu plano e histórico de pagamentos</p>
          </div>
          <LogoutButton variant="outline" />
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList>
            <TabsTrigger value="plans">Planos Disponíveis</TabsTrigger>
            <TabsTrigger value="history">Histórico de Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans?.map((p) => {
                const isCurrent = subscription?.plan_id === p.id;
                const isActive = subscription?.status === "ACTIVE";
                const isPending = subscription?.status && subscription.status !== "ACTIVE";
                const isPendingPayment = isCurrent && isPending;
                const paymentStatus = subscription?.payment_status;
                
                const proofUploadedAt = subscription?.proof_uploaded_at;
                const approvedAt = subscription?.approved_at;
                const isPix = !!subscription?.pix_qr_code;
                const needsProof = isCurrent && isPix && !proofUploadedAt;
                const isWaitingApproval = isCurrent && isPix && proofUploadedAt && !approvedAt;

                // Calculate expiration based on activatedAt + 30 days
                const activatedAt = subscription?.activatedAt ? new Date(subscription.activatedAt) : null;
                const expiresAt = activatedAt ? addDays(activatedAt, 30) : null;
                const daysUntilExpiration = expiresAt ? differenceInDays(expiresAt, new Date()) : null;
                
                // Show renew button if expiring in 7 days or less (including negative days if expired)
                const isExpiringSoon = isCurrent && isActive && daysUntilExpiration !== null && daysUntilExpiration <= 7;

                return (
                  <Card key={p.id} className={isCurrent ? "border-primary" : undefined}>
                    <CardHeader>
                      <CardTitle>{p.name}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {p.description}
                        {isCurrent && (
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Atual" : "Pendente"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {p.price === 0 ? "Grátis" : p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Limite de clientes: {p.clientLimit === null ? "Ilimitado" : p.clientLimit}
                      </div>

                      {isCurrent && isActive && expiresAt && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm border">
                          <p className="font-medium text-muted-foreground mb-1">Vencimento</p>
                          <p className="font-semibold">{format(expiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                        </div>
                      )}

                      {isCurrent && isWaitingApproval && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm border border-yellow-200 dark:border-yellow-800">
                          <p className="font-semibold flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4" />
                            Em análise
                          </p>
                          <p className="text-xs opacity-90">Seu comprovante foi enviado e está aguardando aprovação do administrador.</p>
                        </div>
                      )}

                      {isCurrent && needsProof && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm border border-blue-200 dark:border-blue-800">
                          <p className="font-semibold flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4" />
                            Aguardando Comprovante
                          </p>
                          <p className="text-xs opacity-90">Envie o comprovante para liberar seu acesso.</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      {isCurrent && isActive && !needsProof && !isWaitingApproval ? (
                        isExpiringSoon ? (
                          <div className="w-full space-y-2">
                            <div className="text-xs text-center text-amber-600 font-medium">
                              {daysUntilExpiration !== null && daysUntilExpiration <= 0 
                                ? "Plano vencido"
                                : `Expira em ${daysUntilExpiration} dias`
                              }
                            </div>
                            <Button 
                              onClick={() => handlePaymentMethodSelect(p, "pix")} 
                              className="w-full"
                              disabled={isSelectingPix || isCreatingPreference}
                            >
                              Renovar Plano
                            </Button>
                          </div>
                        ) : (
                          <Button variant="secondary" disabled className="w-full">Plano atual</Button>
                        )
                      ) : needsProof ? (
                        <Button onClick={handleUploadProofClick} className="w-full">Enviar Comprovante</Button>
                      ) : isWaitingApproval ? (
                        <Button variant="secondary" disabled className="w-full">Aguardando aprovação</Button>
                      ) : isPendingPayment ? (
                        <Button variant="secondary" disabled className="w-full">Pagamento pendente</Button>
                      ) : p.price === 0 ? (
                        <Button onClick={() => createPreference(p.id)} disabled={isCreatingPreference} className="w-full">
                          Usar plano gratuito
                        </Button>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            onClick={() => handlePaymentMethodSelect(p, "pix")}
                            disabled={isSelectingPix || isCreatingPreference}
                            className="flex-1"
                          >
                            PIX
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {!userPayment ? (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>Você ainda não tem nenhum pagamento registrado.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pagamento #{userPayment.id.substring(0, 8)}</CardTitle>
                      <CardDescription>
                        Criado em {format(new Date(userPayment.createdAt || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(userPayment.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plano</p>
                      <p className="font-medium">{userPayment.planId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">
                        {userPayment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-12 bg-gray-200"></div>
                      </div>
                      <div>
                        <p className="font-medium">Pagamento Iniciado</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(userPayment.createdAt || new Date()), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    {userPayment.proofUploadedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <div className="w-0.5 h-12 bg-gray-200"></div>
                        </div>
                        <div>
                          <p className="font-medium">Comprovante Enviado</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userPayment.proofUploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                          {userPayment.proofUrl && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setSelectedProof(userPayment.proofUrl)}
                              className="mt-2 h-auto p-0"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar Comprovante
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {userPayment.approvedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Pagamento Aprovado</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userPayment.approvedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}

                    {userPayment.rejectedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Pagamento Rejeitado</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userPayment.rejectedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}

                    {userPayment.canceledAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Pagamento Cancelado</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(userPayment.canceledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* PIX Payment Modal */}
      {showPixModal && pixPaymentData && (
        <PixPaymentModal
          isOpen={showPixModal}
          onClose={() => setShowPixModal(false)}
          pixQrCode={pixPaymentData.pixQrCode}
          pixKey={pixPaymentData.pixKey}
          accountHolder={pixPaymentData.accountHolder}
          amount={pixPaymentData.amount}
          planName={selectedPlan?.name || ""}
          onPaymentConfirmed={handlePixPaymentConfirmed}
        />
      )}

      {/* Proof Upload Modal */}
      {showProofForm && pixPaymentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-950 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Enviar Comprovante</h2>
            <ProofUploadForm
              subscriptionId={pixPaymentData.subscriptionId}
              onUploadSuccess={handleProofUploadSuccess}
              onCancel={() => setShowProofForm(false)}
            />
          </div>
        </div>
      )}

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
    </DashboardLayout>
  );
}
