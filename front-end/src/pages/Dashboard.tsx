import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import DashboardLayout from "@/components/DashboardLayout";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { MessageTemplatesResponse } from "@/api/models/messageTemplate";
import { ProductsResponse } from "@/api/models/products";
import { PixKeysResponse } from "@/api/models/pixKeys";
import { ClientsResponse } from "@/api/models/clients";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "@/api/models/auth";
import {
  Users, Package, CreditCard, MessageSquare,
  Activity, TrendingUp, Wallet, DollarSign,
  Calendar, BarChart3, Clock,
} from "lucide-react";
import {
  Bar, BarChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from "recharts";
import Cookies from "js-cookie";
import { OnboardingChecklist } from "@/components/Onboarding/OnboardingChecklist";
import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  useSubscriptionGuard({ protect: true });

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  // ── Date Filtering ──────────────────────────────────────────
  const [filterType, setFilterType] = useState<"7d" | "30d" | "mt" | "all">("mt");
  
  const dateRange = useMemo(() => {
    const now = new Date();
    if (filterType === "7d") return { start: subDays(now, 7), end: now };
    if (filterType === "30d") return { start: subDays(now, 30), end: now };
    if (filterType === "mt") return { start: startOfMonth(now), end: endOfMonth(now) };
    return { start: undefined, end: undefined };
  }, [filterType]);

  const { data: dataClients, isLoading: isloadingClients } = useQuery<ClientsResponse>({
    queryKey: ["listClients"],
    queryFn: async () =>
      await fetchUseQuery<undefined, ClientsResponse>({
        route: `/clients?user_id=${parsedUser.id}`,
        method: "GET",
      }),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser?.id,
  });

  const { data: dataProducts, isLoading: isloadingProducts } = useQuery<ProductsResponse>({
    queryKey: ["listProducts"],
    queryFn: async () =>
      await fetchUseQuery<undefined, ProductsResponse>({
        route: `/products?user_id=${parsedUser.id}`,
        method: "GET",
      }),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser?.id,
  });

  const { data: summary, isError: isSummaryError, isLoading: isLoadingSummary } = useQuery<any>({
    queryKey: ["dashboardSummary", parsedUser?.id, filterType],
    queryFn: async () =>
      await fetchUseQuery<{ user_id: string; startDate?: string; endDate?: string }, any>({
        route: `/dashboard/summary?user_id=${parsedUser.id}${dateRange.start ? `&startDate=${dateRange.start.toISOString()}` : ""}${dateRange.end ? `&endDate=${dateRange.end.toISOString()}` : ""}`,
        method: "GET",
      }),
    enabled: !!parsedUser?.id,
    refetchOnWindowFocus: false,
  });

  const { data: topProducts, isError: isTopProductsError } = useQuery<any>({
    queryKey: ["dashboardTopProducts", parsedUser?.id],
    queryFn: async () =>
      await fetchUseQuery<{ user_id: string; limit?: number }, any>({
        route: "/dashboard/top-products",
        method: "GET",
        data: { user_id: parsedUser.id, limit: 5 },
      }),
    enabled: !!parsedUser?.id,
    refetchOnWindowFocus: false,
  });

  const isLoading =
    isloadingClients ||
    isloadingProducts ||
    isLoadingSummary;

  if (isLoading) return <SkeletonInformation />;

  // ── derived values ──────────────────────────────────────────
  const totals = summary?.totals || {};
  const period = summary?.payments?.period || {};

  const totalClients = totals.clients || 0;
  const totalProducts = totals.products || 0;
  
  const receivedPeriodValue = period.total || 0;
  const receivedPeriodStr = Number(receivedPeriodValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const recoveredValue = period.recovered || 0;
  const recoveredStr = Number(recoveredValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const pendingValue = period.pending || 0;
  const pendingStr = Number(pendingValue).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const recoveryRate = period.recoveryRate || 0;

  const chartData = [
    { label: "Recebido", value: receivedPeriodValue },
    { label: "Recuperado", value: recoveredValue },
    { label: "Pendente", value: pendingValue },
  ];

  const mainStats = [
    {
      label: "Faturamento Total",
      value: receivedPeriodStr,
      sub: `${period.count || 0} pagamentos no período`,
      icon: DollarSign,
      color: "#00C896",
      bg: "rgba(0,200,150,0.1)",
    },
    {
      label: "Lucro Recuperado",
      value: recoveredStr,
      sub: "Salvo pelo sistema",
      icon: TrendingUp,
      color: "#B482DC",
      bg: "rgba(180,130,220,0.1)",
      highlight: true
    },
    {
      label: "Dinheiro na Mesa",
      value: pendingStr,
      sub: `${period.pendingCount || 0} cobranças em aberto`,
      icon: Clock,
      color: "#F5A623",
      bg: "rgba(245,166,35,0.1)",
    },
    {
      label: "Taxa de Eficiência",
      value: `${recoveryRate}%`,
      sub: "Conversão de cobranças",
      icon: Activity,
      color: "#6496DC",
      bg: "rgba(100,150,220,0.1)",
    }
  ];

  const onboardingSteps = [
    {
      n: 1,
      title: "Configure seus Produtos",
      desc: "Cadastre os produtos ou serviços com seus respectivos valores.",
    },
    {
      n: 2,
      title: "Adicione Clientes",
      desc: "Cadastre clientes e vincule produtos para automatizar cobranças.",
    },
    {
      n: 3,
      title: "Meios de Pagamento",
      desc: "Configure o PIX e links de checkout (cartão/boleto) para receber.",
    },
    {
      n: 4,
      title: "Conecte o WhatsApp",
      desc: "Vincule sua conta WhatsApp para enviar cobranças automatizadas.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── tokens ── */
        .db {
          --cobr: #00C896;
          --cobr-dim: #00A87E;
          --cobr-glow: rgba(0,200,150,0.1);
          --cobr-line: rgba(0,200,150,0.2);
          --bg:  #090C0A;
          --bg2: #0D1210;
          --bg3: #111614;
          --border: rgba(255,255,255,0.06);
          --text: #F0F5F2;
          --text2: #C0D5CC;
          --muted: #5A7A70;
          --muted2: #3A5A50;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
        }

        /* ── layout ── */
        .db-page { padding: 2rem; display: flex; flex-direction: column; gap: 1.75rem; background: var(--bg); min-height: 100vh; }

        /* ── page header ── */
        .db-header { display: flex; flex-direction: column; gap: 0.2rem; }
        .db-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem; font-weight: 800;
          color: var(--text); letter-spacing: -0.6px;
        }
        .db-subtitle { font-size: 0.83rem; color: var(--muted); }

        /* ── section label ── */
        .db-section-label {
          font-size: 0.68rem; font-weight: 700; color: var(--muted2);
          text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.75rem;
        }

        /* ── stat cards ── */
        .db-stats { display: grid; grid-template-columns: repeat(6,1fr); gap: 0.85rem; }
        .db-stat {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 1rem 1.15rem;
          transition: border-color 0.2s;
        }
        .db-stat:hover { border-color: var(--cobr-line); }
        .db-stat.highlighted { background: rgba(0,200,150,0.04); border-color: var(--cobr-line); }
        .db-stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .db-stat-label { font-size: 0.72rem; color: var(--muted); font-weight: 500; }
        .db-stat-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .db-stat-icon svg { width: 14px; height: 14px; }
        .db-stat-value {
          font-family: 'Syne', sans-serif; font-size: 1.55rem; font-weight: 800;
          color: var(--text); letter-spacing: -0.8px; line-height: 1;
        }
        .db-stat-sub { font-size: 0.68rem; color: var(--muted2); margin-top: 0.3rem; }

        /* ── panels ── */
        .db-panel {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 1.25rem 1.4rem;
        }
        .db-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem;
        }
        .db-panel-title {
          font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700;
          color: var(--text2); display: flex; align-items: center; gap: 0.4rem;
        }
        .db-panel-title svg { width: 14px; height: 14px; color: var(--cobr); }

        /* ── chart row ── */
        .db-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }

        /* recharts overrides */
        .db-chart-wrap { height: 160px; margin-top: 0.5rem; }

        /* ── client list ── */
        .db-client-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .db-client-row:last-child { border-bottom: none; }
        .db-client-info { display: flex; align-items: center; gap: 0.65rem; }
        .db-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--cobr-glow); border: 1px solid var(--cobr-line);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.62rem; font-weight: 800; color: var(--cobr);
          font-family: 'Syne', sans-serif; flex-shrink: 0;
        }
        .db-client-name { font-size: 0.8rem; font-weight: 500; color: var(--text2); }
        .db-client-phone { font-size: 0.7rem; color: var(--muted); }
        .db-client-date { font-size: 0.7rem; color: var(--muted2); }
        .db-empty { font-size: 0.82rem; color: var(--muted); text-align: center; padding: 1.5rem 0; }

        /* ── bottom row ── */
        .db-bottom { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.85rem; }
        .db-big-num {
          font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800;
          color: var(--text); letter-spacing: -1.5px; margin-top: 0.25rem;
        }
        .db-big-num.green { color: var(--cobr); }
        .db-panel-sub { font-size: 0.73rem; color: var(--muted); margin-top: 0.3rem; }

        /* top products */
        .db-product-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; padding: 0.3rem 0; }
        .db-product-name { color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
        .db-product-count { color: var(--cobr); font-weight: 700; font-family: 'Syne', sans-serif; }

        /* ── onboarding ── */
        .db-onboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin-top: 0.25rem; }
        .db-step {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; padding: 0.85rem 1rem;
          display: flex; align-items: flex-start; gap: 0.65rem;
          transition: border-color 0.2s;
        }
        .db-step:hover { border-color: var(--cobr-line); }
        .db-step-num {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--cobr-glow); border: 1px solid var(--cobr-line);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.62rem; font-weight: 800; color: var(--cobr);
          font-family: 'Syne', sans-serif; flex-shrink: 0; margin-top: 1px;
        }
        .db-step-title { font-size: 0.8rem; font-weight: 600; color: var(--text2); margin-bottom: 0.15rem; }
        .db-step-desc { font-size: 0.72rem; color: var(--muted); line-height: 1.55; }

        /* ── responsive ── */
        @media (max-width: 1200px) { .db-stats { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 900px)  {
          .db-charts { grid-template-columns: 1fr; }
          .db-bottom  { grid-template-columns: 1fr; }
          .db-onboard-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px)  {
          .db-stats { grid-template-columns: repeat(2,1fr); }
          .db-page  { padding: 1.25rem; }
        }
      `}</style>

      <DashboardLayout>
        <div className="db">
          <div className="db-page">

            {/* ── PAGE HEADER & FILTER ── */}
            <div className="db-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="db-title">Visão do Negócio</h1>
                <p className="db-subtitle">Acompanhe sua performance financeira em tempo real</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg2)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                {[
                  { id: '7d', label: '7 dias' },
                  { id: '30d', label: '30 dias' },
                  { id: 'mt', label: 'Este Mês' },
                  { id: 'all', label: 'Tudo' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterType(opt.id as any)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: filterType === opt.id ? 'var(--cobr)' : 'transparent',
                      color: filterType === opt.id ? '#fff' : 'var(--muted)',
                      border: 'none'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div>
              <div className="db-section-label">Métricas de Performance</div>
              <div id="dashboard-analytics" className="db-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {mainStats.map((s) => (
                  <div key={s.label} className={`db-stat${s.highlight ? " highlighted" : ""}`}>
                    <div className="db-stat-top">
                      <span className="db-stat-label">{s.label}</span>
                      <div className="db-stat-icon" style={{ background: s.bg }}>
                        <s.icon style={{ color: s.color }} />
                      </div>
                    </div>
                    <div className="db-stat-value" style={{ color: s.highlight ? s.color : "var(--text)" }}>
                      {s.value}
                    </div>
                    {s.sub && <div className="db-stat-sub">{s.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── CHARTS ROW ── */}
            <div className="db-charts">
              {/* Bar chart */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div className="db-panel-title">
                    <BarChart3 />
                    Resumo do sistema
                  </div>
                </div>
                <div className="db-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={32}>
                      <XAxis
                        dataKey="label"
                        stroke="#3A5A50"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#3A5A50"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,200,150,0.05)" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid rgba(0,200,150,0.2)",
                          backgroundColor: "#0D1210",
                          color: "#F0F5F2",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "#00C896" }}
                        labelStyle={{ color: "#7A9087", fontWeight: 700 }}
                      />
                      <Bar
                        dataKey="value"
                        fill="rgba(0,200,150,0.25)"
                        stroke="rgba(0,200,150,0.4)"
                        strokeWidth={1}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent clients */}
              <div className="db-panel">
                <div className="db-panel-header">
                  <div className="db-panel-title">
                    <Users />
                    Clientes recentes
                  </div>
                </div>
                {dataClients?.clients && dataClients.clients.length > 0 ? (
                  dataClients.clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="db-client-row">
                      <div className="db-client-info">
                        <div className="db-avatar">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="db-client-name">{client.name}</div>
                          <div className="db-client-phone">{client.phone}</div>
                        </div>
                      </div>
                      <div className="db-client-date">
                        {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="db-empty">Nenhum cliente encontrado.</div>
                )}
              </div>
            </div>

            {/* ── BOTTOM ROW (Contadores Rápidos) ── */}
            <div className="db-bottom">
              {/* Resumo Base */}
              <div className="db-panel">
                <div className="db-panel-title">
                  <Users />
                  Base de Dados
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Clientes</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Syne' }}>{totalClients}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Produtos</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Syne' }}>{totalProducts}</div>
                    </div>
                </div>
                <div className="db-panel-sub" style={{ marginTop: '1rem' }}>Total acumulado na conta</div>
              </div>

              {/* Elegíveis */}
              <div className="db-panel">
                <div className="db-panel-title">
                  <Calendar />
                  Vencimentos Hoje
                </div>
                <div className="db-big-num" style={{ color: 'var(--cobr)' }}>
                  {summary?.dueTodayEligible ?? 0}
                </div>
                <div className="db-panel-sub">
                  Clientes aguardando processamento
                </div>
              </div>

              {/* Top produtos */}
              <div className="db-panel">
                <div className="db-panel-title">
                  <TrendingUp />
                  Produtos em Destaque
                </div>
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                  {!isTopProductsError && (topProducts ?? []).length > 0 ? (
                    (topProducts ?? []).map((p: any) => (
                      <div key={p.product_id} className="db-product-row">
                        <span className="db-product-name">{p.name}</span>
                        <span className="db-product-count">{p.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="db-empty" style={{ textAlign: "left", padding: "0.5rem 0" }}>Sem dados no período.</div>
                  )}
                </div>
              </div>
            </div>

            <OnboardingChecklist />

          </div>
        </div>
      </DashboardLayout>
    </>
  );
}