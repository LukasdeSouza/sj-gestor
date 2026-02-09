import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { Users, Package, CreditCard, MessageSquare, Activity, TrendingUp, Wallet, DollarSign, Calendar, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { MessageTemplatesResponse } from "@/api/models/messageTemplate";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import DashboardLayout from "@/components/DashboardLayout";
import { ProductsResponse } from "@/api/models/products";
import { PixKeysResponse } from "@/api/models/pixKeys";
import { ClientsResponse } from "@/api/models/clients";
import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "@/api/models/auth";
import Cookies from "js-cookie";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";

export default function Dashboard() {
  // Bloqueia acesso quando assinatura não está ativa
  useSubscriptionGuard({ protect: true });

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: dataClients, isLoading: isloadingClients } = useQuery<ClientsResponse>({
    queryKey: ["listClients"],
    queryFn: async () => {
      return await fetchUseQuery<undefined, ClientsResponse>({
        route: `/clients?user_id=${parsedUser.id}`,
        method: "GET"
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });

  const { data: dataProducts, isLoading: isloadingProducts } = useQuery<ProductsResponse>({
    queryKey: ["listProducts"],
    queryFn: async () => {
      return await fetchUseQuery<undefined, ProductsResponse>({
        route: `/products?user_id=${parsedUser.id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });

  const { data: dataPixKeys, isLoading: isloadingPixKeys } = useQuery<PixKeysResponse>({
    queryKey: ["listPixkeys"],
    queryFn: async () => {
      return await fetchUseQuery<undefined, PixKeysResponse>({
        route: `/pix_keys?user_id=${parsedUser.id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });

  const { data: dataMessageTemplates, isLoading: isloadingMessageTemplates } = useQuery<MessageTemplatesResponse>({
    queryKey: ["listMessageTemplates"],
    queryFn: async () => {
      return await fetchUseQuery<undefined, MessageTemplatesResponse>({
        route: `/message_templates?user_id=${parsedUser.id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser.id,
  });

  const { data: summary, isError: isSummaryError } = useQuery<any>({
    queryKey: ["dashboardSummary", parsedUser.id],
    queryFn: async () => {
      return await fetchUseQuery<{ user_id: string }, any>({
        route: "/dashboard/summary",
        method: "GET",
        data: { user_id: parsedUser.id }
      })
    },
    enabled: !!parsedUser.id,
    refetchOnWindowFocus: false,
  });

  const { data: topProducts, isError: isTopProductsError } = useQuery<any>({
    queryKey: ["dashboardTopProducts", parsedUser.id],
    queryFn: async () => {
      return await fetchUseQuery<{ user_id: string, limit?: number }, any>({
        route: "/dashboard/top-products",
        method: "GET",
        data: { user_id: parsedUser.id, limit: 5 }
      })
    },
    enabled: !!parsedUser.id,
    refetchOnWindowFocus: false,
  });

  const statCards = [
    {
      title: "Clientes",
      value: summary?.totals?.clients ?? dataClients?.resultados ?? 0,
      icon: Users,
      color: "from-primary to-primary/80"
    },
    {
      title: "Produtos",
      value: summary?.totals?.products ?? dataProducts?.resultados ?? 0,
      icon: Package,
      color: "from-secondary to-secondary/80"
    },
    {
      title: "Chaves PIX",
      value: summary?.totals?.pixKeys ?? dataPixKeys?.resultados ?? 0,
      icon: CreditCard,
      color: "from-primary to-primary/80"
    },
    {
      title: "Templates",
      value: summary?.totals?.templates ?? dataMessageTemplates?.resultados ?? 0,
      icon: MessageSquare,
      color: "from-secondary to-secondary/80"
    },
    {
      title: "Cobranças Hoje",
      value: summary?.dueTodayEligible ?? 0,
      subtitle: "Clientes com vencimento hoje",
      icon: Calendar,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Recebido Hoje",
      value: summary?.payments?.today?.total ?
        Number(summary.payments.today.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) :
        'R$ 0,00',
      subtitle: `${summary?.payments?.today?.count ?? 0} pagamentos`,
      icon: DollarSign,
      color: "from-green-500 to-green-600"
    }
  ];

  const chartData = [
    { label: "Clientes", value: summary?.totals?.clients ?? 0 },
    { label: "Produtos", value: summary?.totals?.products ?? 0 },
    { label: "Chaves PIX", value: summary?.totals?.pixKeys ?? 0 },
    { label: "Templates", value: summary?.totals?.templates ?? 0 },
  ];

  const totalClients = summary?.totals?.clients ?? 0;
  const autoBillingCount = summary?.autoBillingOn ?? 0;
  const manualBillingCount = Math.max(0, totalClients - autoBillingCount);

  const billingTypeData = [
    { name: "Automática", value: autoBillingCount, color: "#22c55e" },
    { name: "Manual", value: manualBillingCount, color: "#eab308" },
  ].filter(item => item.value > 0);

  const hasBillingTypeData = totalClients > 0;

  if (isloadingClients || isloadingProducts || isloadingPixKeys || isloadingMessageTemplates) {
    return <SkeletonInformation />
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de cobranças
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Bem-vindo ao SJ Gestor!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Este é seu sistema de gestão de cobranças com integração WhatsApp.
              Comece cadastrando seus produtos e clientes para enviar cobranças automatizadas.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">1. Configure seus Produtos</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre os produtos ou serviços que você oferece com seus respectivos valores.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">2. Adicione Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre seus clientes e vincule produtos para automatizar cobranças.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">3. Configure Chaves PIX</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione suas chaves PIX para receber pagamentos facilmente.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">4. Conecte o WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Vincule sua conta WhatsApp para enviar cobranças automatizadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="shadow-soft lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Resumo do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="label"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))', 
                        backgroundColor: 'hsl(var(--popover))',
                        color: 'hsl(var(--popover-foreground))'
                      }}
                      itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                      labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 'bold' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="currentColor"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="shadow-soft lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" /> Cobrança Automática
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full flex items-center justify-center">
                {hasBillingTypeData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={billingTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {billingTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados de clientes.</p>
                )}
              </div>
            </CardContent>
          </Card> */}

          <Card className="shadow-soft lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Clientes Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataClients?.clients?.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
                {(!dataClients?.clients || dataClients.clients.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Recebido este mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isSummaryError ? '-' : (
                  summary?.payments?.month?.total ?
                    Number(summary.payments.month.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) :
                    'R$ 0,00'
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {isSummaryError ? 'Erro ao carregar' : `${summary?.payments?.month?.count ?? 0} pagamentos registrados`}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" /> Elegíveis para envio hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isSummaryError ? '-' : (summary?.dueTodayEligible ?? 0)}</div>
              <p className="text-muted-foreground text-sm mt-1">Clientes com cobrança automática que podem receber mensagem hoje.</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Top Produtos por Cobranças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(!isTopProductsError && (topProducts ?? []).length > 0) && (topProducts ?? []).map((p: any) => (
                  <li key={p.product_id} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="text-muted-foreground">{p.count}</span>
                  </li>
                ))}
                {(!isTopProductsError && (!topProducts || topProducts.length === 0)) && (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
                )}
                {isTopProductsError && (
                  <p className="text-sm text-destructive">Erro ao carregar top produtos.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
