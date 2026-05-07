import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, CreditCard } from "lucide-react";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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

  const { mutate: payWithStripe, isPending: isPaying } = useMutation({
    mutationFn: async (planId: string) =>
      fetchUseQuery<{ planId: string }, any>({ route: "/preferences", method: "POST", data: { planId } }),
    onSuccess: (res: any) => {
      const url = res?.url || res?.initPoint || res?.init_point;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Não foi possível iniciar o checkout.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar link de pagamento.");
    }
  });

  return (
    <DashboardLayout>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "75vh", fontFamily: "'Montserrat', sans-serif" }}>
        
        <div style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "3rem",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Top border accent */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "var(--cobr)" }} />

          <div style={{
            width: 72, height: 72, borderRadius: 20, background: "rgba(245,166,35,0.1)",
            color: "#F5A623", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem"
          }}>
            <Clock size={32} />
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text1)", marginBottom: "0.5rem", letterSpacing: -0.5 }}>
            Assinatura Pendente
          </h1>
          <p style={{ color: "var(--text2)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem", fontWeight: 500 }}>
            O seu acesso está aguardando a confirmação do plano.<br/><br/>
            <strong style={{ color: "var(--text1)" }}>Já pagou?</strong> Aguarde alguns instantes enquanto o nosso sistema processa a liberação automática (isso pode levar alguns minutos).<br/><br/>
            <strong style={{ color: "var(--text1)" }}>Ainda não pagou?</strong> Clique no botão abaixo para concluir o pagamento de forma 100% segura.
          </p>

          <div style={{
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "1.25rem", textAlign: "left", marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>Plano</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text1)" }}>{data?.plan_id || "Nenhum"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#F5A623", background: "rgba(245,166,35,0.1)", padding: "3px 10px", borderRadius: 100, textTransform: "uppercase" }}>{data?.status || "Verificando..."}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data?.plan_id && data.plan_id !== "FREE" && (
              <button
                onClick={() => payWithStripe(data.plan_id as string)}
                disabled={isPaying}
                style={{
                  width: "100%", background: "var(--cobr)", color: "#fff", border: "none", borderRadius: 12,
                  padding: "1.1rem", fontSize: "0.95rem", fontWeight: 800, cursor: isPaying ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
                }}
                onMouseEnter={e => !isPaying && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.background = "var(--cobr-hover)")}
                onMouseLeave={e => !isPaying && (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.background = "var(--cobr)")}
              >
                {isPaying ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                Pagar com Cartão / Pix
              </button>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => navigate("/plans")}
                style={{
                  flex: 1, background: "transparent", border: "1px solid var(--border)", color: "var(--text2)",
                  borderRadius: 12, padding: "1rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--text1)"; e.currentTarget.style.color = "var(--text1)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; }}
              >
                Ver Planos
              </button>
              <button
                onClick={() => refetch()}
                style={{
                  flex: 1, background: "var(--bg)", border: "1px solid transparent", color: "var(--text2)",
                  borderRadius: 12, padding: "1rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text1)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text2)"; }}
              >
                <Loader2 className={isFetching ? "animate-spin" : ""} size={16} /> Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
