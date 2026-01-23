import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function SubscriptionPending() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const from = decodeURIComponent(params.get("from") || "/dashboard");

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { status: string; plan_id: string | null }>({ route: "/subscription/me", method: "GET" }),
    refetchInterval: 4000,
    retry: 0,
  });

  useEffect(() => {
    if (data?.status === "ACTIVE") {
      navigate(from);
    }
  }, [data?.status, from, navigate]);

  return (
    <DashboardLayout>
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-semibold">Pagamento pendente</h1>
          <p className="text-muted-foreground">Sua assinatura está pendente. Complete o pagamento para continuar.</p>
          <div className="text-sm text-muted-foreground">Status atual: {data?.status || "verificando..."}</div>
          <div className="text-sm text-muted-foreground">Plano selecionado: {data?.plan_id || "-"}</div>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate(from)}>Voltar</Button>
            <Button variant="outline" onClick={() => navigate("/plans")}>Ver planos</Button>
            <Button variant="ghost" onClick={() => refetch()}>
              <Loader2 className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Recarregar
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
