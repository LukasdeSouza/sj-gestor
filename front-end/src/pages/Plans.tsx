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

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => await fetchUseQuery<undefined, Plan[]>({ route: "/plans", method: "GET" }),
    retry: 1,
  });

  const { data: subscription } = useQuery<{ status: string; plan_id: Plan["id"] | null }>({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { status: string; plan_id: Plan["id"] | null }>({ route: "/subscription/me", method: "GET" }),
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

  if (isLoading) return <div className="p-6">Carregando planos...</div>;

  return (
    <DashboardLayout>
      <div className="p-0">
        <div className="mb-4 flex justify-end">
          <LogoutButton variant="outline" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((p) => {
            const isCurrent = subscription?.plan_id === p.id;
            const isActive = subscription?.status === "ACTIVE";
            const isPending = subscription?.status && subscription.status !== "ACTIVE";
            const isPendingPayment = isCurrent && isPending;
            return (
            <Card key={p.id} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {p.description}
                  {isCurrent && (
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Atual" : "Pendente"}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {p.price === 0 ? "Grátis" : p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Limite de clientes: {p.clientLimit === null ? "Ilimitado" : p.clientLimit}
                </div>
              </CardContent>
              <CardFooter>
                {isCurrent && isActive ? (
                  <Button variant="secondary" disabled className="w-full">Plano atual</Button>
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
                    {/* <Button
                      onClick={() => handlePaymentMethodSelect(p, "stripe")}
                      disabled={isCreatingPreference || isSelectingPix}
                      className="flex-1"
                    >
                      Cartão
                    </Button> */}
                  </div>
                )}
              </CardFooter>
            </Card>
          )})}
        </div>
      </div>

      {/* PIX Payment Modal */}
      {pixPaymentData && (
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
    </DashboardLayout>
  );
}
