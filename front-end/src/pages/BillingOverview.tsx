import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import DashboardLayout from "@/components/DashboardLayout";
import { ClientsResponse, Client } from "@/api/models/clients";
import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "@/api/models/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import {
  Calendar, DollarSign, Activity, AlertCircle,
  CheckCircle2, Clock, ChevronRight, Zap, History,
  XCircle, Send, LayoutList,
} from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatCurrency(value?: number | null) {
  if (value == null) return "R$ 0,00";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr?: string | Date | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function getDaysUntil(dueAt: string | Date) {
  return Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86_400_000);
}

function getDaysOverdue(dueAt: string | Date) {
  return Math.floor((Date.now() - new Date(dueAt).getTime()) / 86_400_000);
}

// ─── STATUS DO CLIENTE ────────────────────────────────────────────────────────

function StatusBadge({ client }: { client: Client }) {
  if (!client.due_at) return null;

  const isOverdue = new Date(client.due_at) < new Date();
  const days = isOverdue ? getDaysOverdue(client.due_at) : getDaysUntil(client.due_at);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 font-semibold">
        <AlertCircle size={10} />
        {days === 0 ? "Vence hoje" : `${days}d atraso`}
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 font-semibold">
        <Clock size={10} />
        Vence em {days}d
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 font-semibold">
      <CheckCircle2 size={10} />
      Em dia
    </span>
  );
}

// ─── PÁGINA ───────────────────────────────────────────────────────────────────

export default function BillingOverview() {
  const navigate = useNavigate();
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: summary, isLoading: isLoadingSummary } = useQuery<any>({
    queryKey: ["dashboardSummary", parsedUser.id],
    queryFn: () =>
      fetchUseQuery<{ user_id: string }, any>({
        route: "/dashboard/summary",
        method: "GET",
        data: { user_id: parsedUser.id },
      }),
    enabled: !!parsedUser.id,
    refetchOnWindowFocus: false,
  });

  const { data: clientsData, isLoading: isLoadingClients } = useQuery<ClientsResponse>({
    queryKey: ["listClientsOverview", parsedUser.id],
    queryFn: () =>
      fetchUseQuery<{ user_id: string; page: number; limit: number }, ClientsResponse>({
        route: "/clients",
        method: "GET",
        data: { user_id: parsedUser.id, page: 1, limit: 100 },
      }),
    enabled: !!parsedUser.id,
    refetchOnWindowFocus: false,
  });

  const clients = clientsData?.clients ?? [];

  // Separar em grupos
  const overdue = clients.filter(
    (c) => c.due_at && new Date(c.due_at) < new Date()
  );
  const dueSoon = clients.filter((c) => {
    if (!c.due_at || new Date(c.due_at) < new Date()) return false;
    return getDaysUntil(c.due_at) <= 3;
  });
  const upToDate = clients.filter((c) => {
    if (!c.due_at) return false;
    return getDaysUntil(c.due_at) > 3;
  });

  const statCards = [
    {
      title: "Cobranças hoje",
      value: summary?.dueTodayEligible ?? 0,
      sub: "com cobrança automática",
      icon: Calendar,
      color: "from-primary to-primary/80",
    },
    {
      title: "Recebido hoje",
      value: formatCurrency(summary?.payments?.today?.total),
      sub: `${summary?.payments?.today?.count ?? 0} pagamentos`,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Recebido no mês",
      value: formatCurrency(summary?.payments?.month?.total),
      sub: `${summary?.payments?.month?.count ?? 0} pagamentos`,
      icon: Activity,
      color: "from-secondary to-secondary/80",
    },
    {
      title: "Em atraso",
      value: overdue.length,
      sub: "clientes com vencimento passado",
      icon: AlertCircle,
      color: "from-red-500 to-red-600",
    },
  ];

  const isLoading = isLoadingSummary || isLoadingClients;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Acompanhe o status das cobranças dos seus clientes.
            </p>
          </div>
          <Button onClick={() => navigate("/clients")}>
            <Zap className="w-4 h-4 mr-2" />
            Gerenciar clientes
          </Button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {s.title}
                  </CardTitle>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "—" : s.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Listas por status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Em atraso */}
          <ClientGroup
            title="Em atraso"
            icon={<AlertCircle className="w-4 h-4 text-red-500" />}
            clients={overdue}
            emptyText="Nenhum cliente em atraso."
            isLoading={isLoadingClients}
            onClientClick={(id) => navigate(`/clients`)}
          />

          {/* Vence em breve */}
          <ClientGroup
            title="Vence em até 3 dias"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            clients={dueSoon}
            emptyText="Nenhum vencimento próximo."
            isLoading={isLoadingClients}
            onClientClick={(id) => navigate(`/clients`)}
          />

          {/* Em dia */}
          <ClientGroup
            title="Em dia"
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            clients={upToDate}
            emptyText="Nenhum cliente com vencimento futuro."
            isLoading={isLoadingClients}
            onClientClick={(id) => navigate(`/clients`)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── GRUPO DE CLIENTES ────────────────────────────────────────────────────────

function ClientGroup({
  title,
  icon,
  clients,
  emptyText,
  isLoading,
  onClientClick,
}: {
  title: string;
  icon: React.ReactNode;
  clients: Client[];
  emptyText: string;
  isLoading: boolean;
  onClientClick: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {isLoading ? "—" : clients.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="px-4 pb-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="divide-y max-h-72 overflow-y-auto">
            {clients.map((client) => (
              <li
                key={client.id}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 cursor-pointer group"
                onClick={() => onClientClick(client.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.due_at ? `Venc. ${formatDate(client.due_at)}` : "Sem vencimento"}
                    {client.product?.value != null && ` · ${formatCurrency(Number(client.product.value))}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <StatusBadge client={client} />
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
