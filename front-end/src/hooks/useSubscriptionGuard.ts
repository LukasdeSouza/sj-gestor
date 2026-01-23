import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "@/api/models/auth";
import { useEffect, useMemo } from "react";
import Cookies from "js-cookie";

type Status = "ACTIVE" | "PENDING" | "NONE" | string;

export function useSubscriptionGuard(opts?: { protect?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { status: Status; plan_id: string | null }>({ route: "/subscription/me", method: "GET" }),
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
  }, [data?.status, opts?.protect, pathname, navigate, isLoading]);

  return data;
}
