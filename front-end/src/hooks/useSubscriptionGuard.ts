import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "@/api/models/auth";
import { useEffect, useMemo } from "react";
import Cookies from "js-cookie";

type Status = "ACTIVE" | "PENDING" | "NONE" | string;

export interface SubscriptionStatusData {
  status: Status;
  plan_id: string | null;
  email_verified: boolean;
  planName?: string;
  trial?: {
    isActive: boolean;
    isExpired: boolean;
    daysRemaining: number;
    expiresAt: string;
  };
  usage?: {
    current: number;
    limit: number;
  };
}

export function useSubscriptionGuard(opts?: { protect?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, SubscriptionStatusData>({ route: "/subscription/me", method: "GET" }),
    staleTime: 30_000,
    retry: 0,
  });

  const isAdmin = useMemo(() => {
    try {
      const user = Cookies.get("user");
      const parsed: AuthUser | null = user ? JSON.parse(user) : null;
      return parsed?.group?.name === "ADMIN";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!opts?.protect) return;
    // Evita redirecionar enquanto a assinatura ainda está carregando
    if (isLoading) return;
    const status = data?.status;
    const isPendingRoute = pathname.startsWith("/assinatura");
    const isPlans = pathname === "/plans";
    const isVerificationRoute = pathname === "/verify-email-notice" || pathname === "/verify-email";

    // 1. Verificação de E-mail (Prioridade Máxima)
    if (data && !data.email_verified && !isVerificationRoute) {
      if (isAdmin) return;
      navigate("/verify-email-notice");
      return;
    }

    // Sem assinatura: direciona para planos, exceto para ADMIN (não redireciona admin)
    if (!status || status === "NONE") {
      if (isAdmin) return;
      // Não há assinatura: direciona para planos (exceto se já está em /plans)
      if (!isPlans) navigate("/plans");
      return;
    }

    if (status !== "ACTIVE") {
      // Permitir ir aos planos para trocar antes de pagar
      if (!isPendingRoute && !isPlans) {
        const returnTo = encodeURIComponent(pathname || "/dashboard");
        navigate(`/assinatura/pendente?from=${returnTo}`);
      }
    }
  }, [data?.status, data?.email_verified, opts?.protect, pathname, navigate, isLoading]);

  return data;
}
