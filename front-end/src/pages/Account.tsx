import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { toast } from "react-toastify";

export default function Account() {
  const { data } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => await fetchUseQuery<undefined, { status: string; plan_id: string | null }>({ route: "/subscription/me", method: "GET" }),
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

  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Status: <span className="font-medium text-foreground">{data?.status || "-"}</span></div>
            <div className="text-sm text-muted-foreground">Plano: <span className="font-medium text-foreground">{data?.plan_id || "-"}</span></div>
            <Button onClick={() => mutate()} disabled={isPending}>
              Gerenciar pagamento (Stripe)
            </Button>
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

