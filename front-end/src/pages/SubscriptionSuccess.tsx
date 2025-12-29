import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error("session_id ausente");
      // Chama o finalize no back-end para ativar assinatura (Stripe)
      return await fetchUseQuery<{ session_id: string }, { status: string; planId: string }>({
        route: "/checkout/finalize",
        method: "GET",
        data: { session_id: sessionId },
      });
    },
    onSuccess: (res) => {
      if (res.status === "ACTIVE") {
        toast.success("Assinatura ativada com sucesso!");
      } else {
        toast.info(`Status do pagamento: ${res.status}`);
      }
      navigate("/dashboard");
    },
    onError: (err: any) => {
      const e = err as ApiErrorQuery;
      toast.error(e?.message || "Falha ao validar pagamento");
    },
  });

  useEffect(() => {
    mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className={`h-5 w-5 ${isPending ? "animate-spin" : ""}`} />
        Validando pagamento...
      </div>
    </div>
  );
}
