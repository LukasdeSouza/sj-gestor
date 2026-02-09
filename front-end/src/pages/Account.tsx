import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { toast } from "react-toastify";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function Account() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { 
      id: string; 
      status: string; 
      plan_id: string | null; 
      activatedAt?: string;
      proof_uploaded_at?: string | null;
      approved_at?: string | null;
      pix_qr_code?: string | null;
    }>({ route: "/subscription/me", method: "GET" }),
    retry: 0,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => await fetchUseQuery<undefined, { url: string }>({ route: "/stripe/portal", method: "POST" }),
    onSuccess: (res) => {
      if (res.url) window.open(res.url, "_blank", "noopener,noreferrer");
      else toast.error("Portal indisponível");
    },
    onError: () => toast.error("Falha ao abrir portal"),
  });

  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      if (!data?.id) return;
      return await fetchUseQuery({
        route: `/subscriptions/${data.id}/cancel`,
        method: "PATCH",
      });
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["subscription", "me"] });
    },
    onError: (error: ApiErrorQuery) => {
      toast.error(error.message || "Erro ao cancelar assinatura");
    },
  });

  const handleCancel = () => {
    if (window.confirm("Tem certeza que deseja cancelar sua assinatura? Você voltará para o plano gratuito.")) {
      cancelSubscription();
    }
  };

  // Calculate expiration based on activatedAt + 30 days
  const activatedAt = data?.activatedAt ? new Date(data.activatedAt) : null;
  const expiresAt = activatedAt ? addDays(activatedAt, 30) : null;
  const isExpired = expiresAt ? new Date() > expiresAt : false;

  const getStatusBadge = (sub: typeof data) => {
    if (!sub) return <Badge variant="outline">-</Badge>;
    
    const isPix = !!sub.pix_qr_code;
    const needsProof = isPix && !sub.proof_uploaded_at;
    const isWaitingApproval = isPix && sub.proof_uploaded_at && !sub.approved_at;

    if (needsProof) return <Badge variant="secondary">Aguardando Comprovante</Badge>;
    if (isWaitingApproval) return <Badge variant="outline">Em Análise</Badge>;

    const status = sub.status;
    
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      ACTIVE: { label: 'Ativo', variant: 'default' },
      PENDING: { label: 'Pendente', variant: 'secondary' },
      CANCELED: { label: 'Cancelado', variant: 'secondary' },
      EXPIRED: { label: 'Expirado', variant: 'destructive' },
      PROOF_UPLOADED: { label: 'Em Análise', variant: 'outline' },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    
    // Override visual status if expired but backend says ACTIVE
    if (status === 'ACTIVE' && isExpired) {
        return <Badge variant="destructive">Vencido</Badge>;
    }

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(data)}
            </div>
            
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Plano</span>
                <span className="font-medium">{data?.plan_id || "-"}</span>
            </div>

            {activatedAt && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ativado em</span>
                    <span className="font-medium">{format(activatedAt, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
            )}

            {expiresAt && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vencimento</span>
                    <span className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                        {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                </div>
            )}

            <Button onClick={() => mutate()} disabled={isPending} className="w-full mt-4" variant="outline">
              Gerenciar pagamento (Stripe)
            </Button>

            {data && data.plan_id !== "FREE" && data.status !== "CANCELED" && (
              <Button 
                onClick={handleCancel} 
                disabled={isCancelling} 
                variant="destructive" 
                className="w-full mt-2"
              >
                Cancelar Assinatura
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Em breve: atualizar nome, e-mail e senha.</div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
