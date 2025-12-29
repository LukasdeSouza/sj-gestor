import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useNavigate } from "react-router-dom";

export default function SubscriptionBanner() {
  const navigate = useNavigate();
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { status: string; plan_id: string | null }>({ route: "/subscription/me", method: "GET" }),
    staleTime: 15_000,
    retry: 0,
  });

  if (!data || data.status === "ACTIVE" || data.status === "NONE") return null;

  return (
    <div className="sticky top-16 z-30 w-full">
      <div className="mx-4 lg:mx-8 rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="font-semibold text-yellow-800">Assinatura pendente</div>
              <div className="text-sm text-yellow-800/80">Conclua o pagamento para liberar todas as funcionalidades.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/plans")}>Ver planos</Button>
            <Button variant="ghost" onClick={() => refetch()}>
              <Loader2 className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Verificar status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

