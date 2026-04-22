import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { toast } from "react-toastify";
import LogoutButton from "@/components/LogoutButton";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import PixPaymentModal from "@/components/Subscription/PixPaymentModal";
import ProofUploadForm from "@/components/Subscription/ProofUploadForm";
import { selectPixPlan, getUserPayment } from "@/api/models/payments";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye, Download, Clock, CheckCircle2, XCircle,
  CreditCard, Zap, Users, Star, AlertTriangle,
  Trophy, Rocket, ShieldCheck, Settings,
  Sparkles, MousePointerClick, TrendingUp,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PlanId = "FREE" | "STARTER" | "PRO" | "ELITE" | "PRO_100" | "PRO_UNLIMITED";

type Plan = {
  id: PlanId;
  name: string;
  price: number;
  clientLimit: number | null;
  description: string;
  features?: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
  };
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function fmtDateLong(date: Date) {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: "Pendente", color: "#F5A623", bg: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)" },
  PROOF_UPLOADED: { label: "Comprovante Enviado", color: "#818CF8", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
  APPROVED: { label: "Aprovado", color: "#00C896", bg: "rgba(0,200,150,0.08)", border: "rgba(0,200,150,0.2)" },
  REJECTED: { label: "Rejeitado", color: "#E84545", bg: "rgba(232,69,69,0.08)", border: "rgba(232,69,69,0.2)" },
  CANCELED: { label: "Cancelado", color: "#5A7A70", bg: "rgba(90,122,112,0.08)", border: "rgba(90,122,112,0.15)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.CANCELED;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
      {s.label}
    </span>
  );
}

// ─── TIMELINE EVENT ───────────────────────────────────────────────────────────

function TimelineEvent({ label, date, color, last = false }: {
  label: string; date: string; color: string; last?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, border: `2px solid ${color}40`, flexShrink: 0, marginTop: 2 }} />
        {!last && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4, minHeight: 28 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#C0D5CC" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#4A6A60", marginTop: 2 }}>{date}</div>
      </div>
    </div>
  );
}

// ─── PLAN ICON ────────────────────────────────────────────────────────────────

function PlanIcon({ id }: { id: PlanId }) {
  if (id === "FREE") return <Users size={18} color="#5A7A70" />;
  if (id === "STARTER" || id === "PRO_100") return <Zap size={18} color="#00C896" />;
  if (id === "PRO" || id === "PRO_UNLIMITED") return <Star size={18} color="#818CF8" />;
  if (id === "ELITE") return <Rocket size={18} color="#F5A623" />;
  return <ShieldCheck size={18} color="#5A7A70" />;
}

function planAccent(id: PlanId) {
  if (id === "FREE") return { color: "#5A7A70", border: "rgba(90,122,112,0.2)", bg: "rgba(90,122,112,0.06)" };
  if (id === "STARTER" || id === "PRO_100") return { color: "#00C896", border: "rgba(0,200,150,0.25)", bg: "rgba(0,200,150,0.05)" };
  if (id === "PRO" || id === "PRO_UNLIMITED") return { color: "#818CF8", border: "rgba(129,140,248,0.25)", bg: "rgba(129,140,248,0.05)" };
  if (id === "ELITE") return { color: "#F5A623", border: "rgba(245,166,35,0.3)", bg: "rgba(245,166,35,0.05)" };
  return { color: "#5A7A70", border: "rgba(255,255,255,0.1)", bg: "transparent" };
}

// ─── MODAL COMPONENT ─────────────────────────────────────────────────────────

function WelcomeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-glow" />
        <div className="welcome-header">
          <div className="welcome-badge">
            <Sparkles size={14} /> Boas-vindas ao Cobr
          </div>
          <h2 className="welcome-title">O seu sucesso financeiro começa agora.</h2>
          <p className="welcome-subtitle">
            Você está a um passo de automatizar suas cobranças e ter o controle total da sua inadimplência.
          </p>
        </div>

        <div className="welcome-grid">
          <div className="welcome-item">
            <div className="welcome-icon-box" style={{ background: "rgba(0,200,150,0.1)" }}>
              <Zap color="#00C896" size={20} />
            </div>
            <div>
              <div className="welcome-item-title">Automação Inteligente</div>
              <p className="welcome-item-desc">Régua de cobrança automática via WhatsApp, E-mail e SMS.</p>
            </div>
          </div>

          <div className="welcome-item">
            <div className="welcome-icon-box" style={{ background: "rgba(129,140,248,0.1)" }}>
              <MousePointerClick color="#818CF8" size={20} />
            </div>
            <div>
              <div className="welcome-item-title">Pix Instantâneo</div>
              <p className="welcome-item-desc">Links de pagamento integrados para recebimento ultra veloz.</p>
            </div>
          </div>

          <div className="welcome-item">
            <div className="welcome-icon-box" style={{ background: "rgba(245,166,35,0.1)" }}>
              <TrendingUp color="#F5A623" size={20} />
            </div>
            <div>
              <div className="welcome-item-title">Escalabilidade</div>
              <p className="welcome-item-desc">Gestão simplificada de clientes que cresce com o seu negócio.</p>
            </div>
          </div>
        </div>

        <button className="welcome-cta" onClick={onClose}>
          Escolher meu Plano <Rocket size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function Plans() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"plans" | "history">("plans");
  const [showPixModal, setShowPixModal] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('cobr_first_time') === 'true') {
      localStorage.removeItem('cobr_first_time');
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
  };

  // ── queries ──────────────────────────────────────────────────────────────

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => fetchUseQuery<undefined, Plan[]>({ route: "/plans", method: "GET" }),
    retry: 1,
  });

  const { data: subscription } = useQuery<{
    id: string; status: string; plan_id: PlanId | null;
    activatedAt?: string; payment_status?: string;
    proof_uploaded_at?: string | null; approved_at?: string | null;
    pix_qr_code?: string | null;
    stripe_subscription_id?: string | null;
  }>({
    queryKey: ["subscription", "me"],
    queryFn: async () => fetchUseQuery<undefined, any>({ route: "/subscription/me", method: "GET" }),
    staleTime: 30_000,
    retry: 0,
  });

  const { data: userPayment } = useQuery({
    queryKey: ["payment", "me"],
    queryFn: async () => { try { return await getUserPayment(); } catch { return null; } },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  // ── mutations ─────────────────────────────────────────────────────────────

  const { mutate: createPreference, isPending: isCreatingPreference } = useMutation({
    mutationFn: async (planId: PlanId) =>
      fetchUseQuery<{ planId: PlanId }, any>({ route: "/preferences", method: "POST", data: { planId } }),
    onSuccess: async (res: any) => {
      const url = res?.url || res?.initPoint || res?.init_point;
      const plan = res?.plan;
      if (url) { window.open(url, "_blank", "noopener,noreferrer"); return; }
      if (plan && (plan.id === "FREE" || Number(plan.price) === 0)) {
        toast.success("Plano gratuito ativado com sucesso");
        await queryClient.invalidateQueries({ queryKey: ["subscription", "me"] });
        return;
      }
      toast.error("Não foi possível iniciar o checkout");
    },
    onError: (err: ApiErrorQuery) => toast.error(err.message || "Erro ao criar preferência"),
  });

  const { mutate: createPortalSession, isPending: isCreatingPortal } = useMutation({
    mutationFn: async () => fetchUseQuery<undefined, { url: string }>({ route: "/stripe/portal", method: "POST" }),
    onSuccess: (res: any) => {
      if (res?.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Não foi possível acessar o portal de gerenciamento");
      }
    },
    onError: (err: ApiErrorQuery) => toast.error(err.message || "Erro ao acessar o portal do Stripe"),
  });

  const { mutate: selectPix, isPending: isSelectingPix } = useMutation({
    mutationFn: async (planId: PlanId) => selectPixPlan(planId),
    onSuccess: (data) => { setPixPaymentData(data); setShowPixModal(true); },
    onError: (err: ApiErrorQuery) => toast.error(err.message || "Erro ao selecionar plano PIX"),
  });

  // ── handlers ─────────────────────────────────────────────────────────────

  const handlePaymentMethodSelect = (plan: Plan, method: "stripe" | "pix") => {
    setSelectedPlan(plan);
    if (method === "stripe") createPreference(plan.id);
    else selectPix(plan.id);
  };

  const handlePixPaymentConfirmed = () => { setShowPixModal(false); setShowProofForm(true); };

  const handleProofUploadSuccess = () => {
    setShowProofForm(false);
    toast.success("Comprovante enviado! Aguarde aprovação do administrador.");
    queryClient.invalidateQueries({ queryKey: ["payment", "me"] });
  };

  const handleUploadProofClick = () => {
    if (subscription?.id) { setPixPaymentData({ subscriptionId: subscription.id }); setShowProofForm(true); }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(0,200,150,0.15)", borderTopColor: "#00C896", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  const tabBtn = (id: "plans" | "history"): React.CSSProperties => ({
    background: activeTab === id ? "#141917" : "transparent",
    border: `1px solid ${activeTab === id ? "rgba(0,200,150,0.2)" : "transparent"}`,
    color: activeTab === id ? "#00C896" : "#5A7A70",
    borderRadius: 7, padding: "0.5rem 1rem",
    fontSize: 12, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
        .pl-card:hover { border-color: rgba(255,255,255,0.15) !important; }
        .pl-btn-primary { display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#00C896;color:#051A12;border:none;border-radius:8px;padding:0.65rem 1.1rem;font-family:'Syne',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:background 0.2s;width:100%; text-decoration: none; }
        .pl-btn-primary:hover:not(:disabled){background:#00A87E;}
        .pl-btn-primary:disabled{opacity:0.55;cursor:not-allowed;}
        .pl-btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#5A7A70;border-radius:8px;padding:0.65rem 1.1rem;font-family:'Syne',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.15s;width:100%;}
        .pl-btn-ghost:hover:not(:disabled){border-color:rgba(0,200,150,0.25);color:#C0D5CC;}
        .pl-btn-ghost:disabled{opacity:0.4;cursor:not-allowed;}
        .pl-btn-outline{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:transparent;border:1px solid rgba(90,122,112,0.3);color:#C0D5CC;border-radius:8px;padding:0.65rem 1.1rem;font-family:'Syne',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.15s;width:100%;}
        .pl-btn-outline:hover:not(:disabled){border-color:#00C896;color:#00C896;}
        .pl-tab:hover{color:#C0D5CC !important;}
        .pl-proof-btn:hover{border-color:rgba(0,200,150,0.3) !important;color:#00C896 !important;}
        .pl-modal-close:hover{color:#F0F5F2 !important;}

        /* Welcome Modal Styles */
        .welcome-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px); display: flex; align-items: center;
          justify-content: center; z-index: 9999; padding: 1.5rem;
          animation: fadeIn 0.3s ease;
        }
        .welcome-modal {
          background: #0D1210; width: 100%; max-width: 540px;
          border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
          padding: 3rem 2.5rem; position: relative; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .welcome-glow {
          position: absolute; top: -50px; left: -50px; width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(0,200,150,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .welcome-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,200,150,0.1); color: #00C896;
          padding: 6px 12px; borderRadius: 100px; font-size: 11px;
          text-transform: uppercase; letter-spacing: 1px; font-weight: 800;
          font-family: 'Syne', sans-serif; margin-bottom: 1.5rem;
        }
        .welcome-title {
          font-family: 'Syne', sans-serif; font-size: 2rem; fontWeight: 800;
          color: #F0F5F2; line-height: 1.1; letter-spacing: -1.2px;
          margin-bottom: 1rem;
        }
        .welcome-subtitle {
          color: #6A8A80; font-size: 1rem; line-height: 1.6;
          margin-bottom: 2.5rem;
          font-weight: 400
        }
        .welcome-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; }
        .welcome-item { display: flex; gap: 1.25rem; align-items: flex-start; }
        .welcome-icon-box {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .welcome-item-title {
          font-family: 'Syne', sans-serif; color: #F0F5F2;
          font-size: 0.95rem; fontWeight: 700; margin-bottom: 4px;
        }
        .welcome-item-desc { color: #5A7A70; font-size: 0.85rem; line-height: 1.5; font-weight: 400 }
        .welcome-cta {
          width: 100%; background: #00C896; color: #051A12;
          border: none; border-radius: 12px; padding: 1.25rem;
          font-family: 'Syne', sans-serif; font-size: 1rem; fontWeight: 800;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 10px; transition: all 0.2s;
        }
        .welcome-cta:hover { background: #00EBAF; transform: translateY(-2px); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <WelcomeModal isOpen={showWelcome} onClose={handleCloseWelcome} />

      <DashboardLayout>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", fontFamily: "'DM Sans', sans-serif", color: "#F0F5F2" }}>

          {/* ── HEADER ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.5, margin: "0 0 3px" }}>
                Assinatura
              </h1>
              <p style={{ fontSize: "0.8rem", color: "#5A7A70", margin: 0 }}>Gerencie seu plano e histórico de pagamentos</p>
            </div>
            <LogoutButton variant="outline" />
          </div>

          {/* ── TABS ── */}
          <div style={{ display: "flex", gap: 4, background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 4, width: "fit-content" }}>
            <button className="pl-tab" style={tabBtn("plans")} onClick={() => setActiveTab("plans")}>Planos disponíveis</button>
            <button className="pl-tab" style={tabBtn("history")} onClick={() => setActiveTab("history")}>Histórico</button>
          </div>

          {/* ── PLANS TAB ── */}
          {activeTab === "plans" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
              {plans?.map((p) => {
                const accent = planAccent(p.id);
                const isActive = subscription?.status === "ACTIVE";
                const isCurrent = subscription?.plan_id === p.id && isActive;
                const isPendingPayment = subscription?.plan_id === p.id && subscription?.status === "PENDING";
                const isStripe = !!subscription?.stripe_subscription_id;
                const needsProof = false;
                const isWaitingApproval = false;
                const activatedAt = subscription?.activatedAt ? new Date(subscription.activatedAt) : null;
                const expiresAt = activatedAt ? addDays(activatedAt, 30) : null;
                const daysUntilExpiration = expiresAt ? differenceInDays(expiresAt, new Date()) : null;
                const isExpiringSoon = isCurrent && isActive && daysUntilExpiration !== null && daysUntilExpiration <= 7;

                return (
                  <div
                    key={p.id}
                    className="pl-card"
                    style={{
                      background: isCurrent ? accent.bg : "#0D1210",
                      border: `1px solid ${isCurrent ? accent.border : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 14, padding: "1.5rem",
                      display: "flex", flexDirection: "column", gap: "1rem",
                      transition: "border-color 0.2s", position: "relative", overflow: "hidden",
                    }}
                  >
                    {/* Recommendation badge */}
                    {p.id === "PRO" && (
                      <div style={{ position: "absolute", top: 0, right: 0 }}>
                        <div style={{ background: "#818CF8", color: "#F0F5F2", fontSize: 9, fontWeight: 800, fontFamily: "'Syne', sans-serif", padding: "3px 10px", borderRadius: "0 0 0 8px" }}>
                          RECOMENDADO
                        </div>
                      </div>
                    )}
                    {p.id === "ELITE" && (
                      <div style={{ position: "absolute", top: 0, right: 0 }}>
                        <div style={{ background: "#F5A623", color: "#051A12", fontSize: 9, fontWeight: 800, fontFamily: "'Syne', sans-serif", padding: "3px 10px", borderRadius: "0 0 0 8px" }}>
                          MAIS VANTAGEM
                        </div>
                      </div>
                    )}

                    {/* Plan header */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${accent.color}15`, border: `1px solid ${accent.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <PlanIcon id={p.id} />
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.9rem", fontWeight: 800, color: "#F0F5F2" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#5A7A70" }}>{p.description}</div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span style={{ background: isActive ? "rgba(0,200,150,0.1)" : "rgba(245,166,35,0.1)", color: isActive ? "#00C896" : "#F5A623", border: `1px solid ${isActive ? "rgba(0,200,150,0.2)" : "rgba(245,166,35,0.2)"}`, borderRadius: 100, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap" }}>
                          {isActive ? "Atual" : "Pendente"}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: 800, color: accent.color, letterSpacing: -1.5, lineHeight: 1 }}>
                        {p.price === 0 ? "Grátis" : fmtCurrency(p.price)}
                      </div>
                      {p.price > 0 && <div style={{ fontSize: 11, color: "#3A5A50", marginTop: 3 }}>/mês</div>}

                      {/* Features list */}
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 11, color: "#C0D5CC", display: "flex", alignItems: "center", gap: 6 }}>
                          <Users size={12} color="#4A6A60" />
                          {p.clientLimit === null ? "Clientes ilimitados" : `${p.clientLimit} devedores`}
                        </div>
                        {p.features?.whatsapp && (
                          <div style={{ fontSize: 11, color: "#C0D5CC", display: "flex", alignItems: "center", gap: 6 }}>
                            <Zap size={12} color="#00C896" />
                            Avisos via WhatsApp
                          </div>
                        )}
                        {p.features?.email && (
                          <div style={{ fontSize: 11, color: "#C0D5CC", display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={12} color="#818CF8" />
                            Avisos via E-mail
                          </div>
                        )}
                        {p.features?.sms && (
                          <div style={{ fontSize: 11, color: "#C0D5CC", display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={12} color="#F5A623" />
                            Bônus SMS Mensal
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expiry info */}
                    {isCurrent && isActive && expiresAt && (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "0.65rem 0.85rem" }}>
                        <div style={{ fontSize: 10, color: "#3A5A50", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Vencimento</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#C0D5CC" }}>{fmtDateLong(expiresAt)}</div>
                      </div>
                    )}

                    {/* Waiting approval */}
                    {isWaitingApproval && (
                      <div style={{ background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 9, padding: "0.65rem 0.85rem", display: "flex", gap: 8 }}>
                        <Clock size={13} color="#F5A623" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#F5A623" }}>Em análise</div>
                          <div style={{ fontSize: 10, color: "#8A7040", marginTop: 2 }}>Comprovante enviado, aguardando aprovação.</div>
                        </div>
                      </div>
                    )}

                    {/* Needs proof */}
                    {needsProof && (
                      <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 9, padding: "0.65rem 0.85rem", display: "flex", gap: 8 }}>
                        <AlertTriangle size={13} color="#818CF8" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#818CF8" }}>Comprovante necessário</div>
                          <div style={{ fontSize: 10, color: "#4A4A80", marginTop: 2 }}>Envie o PIX para liberar o acesso.</div>
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{ marginTop: "auto" }}>
                      {isCurrent && isActive && !needsProof && !isWaitingApproval ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {isExpiringSoon && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="pl-btn-primary" onClick={() => createPreference(p.id)} disabled={isCreatingPreference || isSelectingPix}>
                                <CreditCard size={13} /> {isCreatingPreference ? "..." : "Renovar"}
                              </button>
                              <button className="pl-btn-ghost" onClick={() => handlePaymentMethodSelect(p, "pix")} disabled={isSelectingPix || isCreatingPreference}>
                                PIX
                              </button>
                            </div>
                          )}
                          {!isExpiringSoon && isStripe && (
                            <button className="pl-btn-outline" onClick={() => createPortalSession()} disabled={isCreatingPortal}>
                              <Settings size={13} /> {isCreatingPortal ? "Acessando..." : "Gerenciar Assinatura"}
                            </button>
                          )}
                          {!isExpiringSoon && !isStripe && (
                            <button className="pl-btn-ghost" disabled style={{ cursor: "not-allowed" }}>
                              <CheckCircle2 size={13} /> Plano atual
                            </button>
                          )}
                        </div>
                      ) : needsProof ? (
                        <button className="pl-btn-primary" onClick={handleUploadProofClick}>
                          Enviar comprovante
                        </button>
                      ) : isWaitingApproval ? (
                        <button className="pl-btn-ghost" disabled>
                          <Clock size={13} /> Aguardando aprovação
                        </button>
                      ) : isPendingPayment ? (
                        <button className="pl-btn-ghost" disabled>
                          Pagamento pendente
                        </button>
                      ) : p.price === 0 ? (
                        <button className="pl-btn-primary" onClick={() => createPreference(p.id)} disabled={isCreatingPreference} style={{ background: '#00C896', color: '#051A12', boxShadow: '0 8px 30px rgba(0,200,150,0.3)' }}>
                          {isCreatingPreference ? "Aguarde..." : "Começar Teste Grátis"}
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="pl-btn-primary" onClick={() => createPreference(p.id)} disabled={isCreatingPreference || isSelectingPix}>
                            <CreditCard size={13} /> {isCreatingPreference ? "..." : "Assinar"}
                          </button>
                          <button className="pl-btn-ghost" onClick={() => handlePaymentMethodSelect(p, "pix")} disabled={isSelectingPix || isCreatingPreference}>
                            PIX
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            !userPayment ? (
              <div style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "3rem", textAlign: "center", color: "#3A5A50" }}>
                <CreditCard size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
                <p style={{ fontSize: 13, margin: 0 }}>Nenhum pagamento registrado ainda.</p>
              </div>
            ) : (
              <div style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
                {/* Payment header */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.9rem", fontWeight: 800, color: "#F0F5F2" }}>
                      Pagamento #{userPayment.id.substring(0, 8)}
                    </div>
                    <div style={{ fontSize: 11, color: "#5A7A70", marginTop: 2 }}>
                      Criado em {fmtDate(userPayment.createdAt || new Date().toISOString())}
                    </div>
                  </div>
                  <StatusBadge status={userPayment.status} />
                </div>

                {/* Payment details */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.25rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9, padding: "0.75rem 1rem" }}>
                      <div style={{ fontSize: 10, color: "#3A5A50", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Plano</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#C0D5CC" }}>{userPayment.planId}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9, padding: "0.75rem 1rem" }}>
                      <div style={{ fontSize: 10, color: "#3A5A50", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Valor</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#00C896" }}>
                        {fmtCurrency(userPayment.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ fontSize: 10, color: "#3A5A50", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: "0.85rem" }}>Histórico</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <TimelineEvent label="Pagamento iniciado" date={fmtDate(userPayment.createdAt || new Date().toISOString())} color="#818CF8" last={!userPayment.proofUploadedAt && !userPayment.approvedAt && !userPayment.rejectedAt && !userPayment.canceledAt} />

                      {userPayment.proofUploadedAt && (
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#818CF8", border: "2px solid rgba(99,102,241,0.3)", flexShrink: 0, marginTop: 2 }} />
                            {(userPayment.approvedAt || userPayment.rejectedAt || userPayment.canceledAt) && <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 4, minHeight: 28 }} />}
                          </div>
                          <div style={{ paddingBottom: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#C0D5CC" }}>Comprovante enviado</div>
                            <div style={{ fontSize: 11, color: "#4A6A60", marginTop: 2 }}>{fmtDate(userPayment.proofUploadedAt)}</div>
                            {userPayment.proofUrl && (
                              <button
                                className="pl-proof-btn"
                                onClick={() => setSelectedProof(userPayment.proofUrl)}
                                style={{ marginTop: 6, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#5A7A70", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}
                              >
                                <Eye size={11} /> Visualizar
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {userPayment.approvedAt && (
                        <TimelineEvent label="Pagamento aprovado" date={fmtDate(userPayment.approvedAt)} color="#00C896" last />
                      )}
                      {userPayment.rejectedAt && (
                        <TimelineEvent label="Pagamento rejeitado" date={fmtDate(userPayment.rejectedAt)} color="#E84545" last />
                      )}
                      {userPayment.canceledAt && (
                        <TimelineEvent label="Pagamento cancelado" date={fmtDate(userPayment.canceledAt)} color="#5A7A70" last />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* ── PIX MODAL ── */}
        {showPixModal && pixPaymentData && (
          <PixPaymentModal
            isOpen={showPixModal}
            onClose={() => setShowPixModal(false)}
            pixQrCode={pixPaymentData.pixQrCode}
            pixKey={pixPaymentData.pixKey}
            accountHolder={pixPaymentData.accountHolder}
            amount={pixPaymentData.amount}
            planName={selectedPlan?.name || ""}
            onPaymentConfirmed={handlePixPaymentConfirmed}
          />
        )}

        {/* ── PROOF UPLOAD MODAL ── */}
        {showProofForm && pixPaymentData && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem", maxWidth: 420, width: "100%", margin: "1rem" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#F0F5F2", marginBottom: "1rem" }}>
                Enviar Comprovante
              </div>
              <ProofUploadForm
                subscriptionId={pixPaymentData.subscriptionId}
                onUploadSuccess={handleProofUploadSuccess}
                onCancel={() => setShowProofForm(false)}
              />
            </div>
          </div>
        )}

        {/* ── PROOF PREVIEW MODAL ── */}
        {selectedProof && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem", maxWidth: 560, width: "100%", margin: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.95rem", fontWeight: 800, color: "#F0F5F2" }}>
                  Comprovante de Pagamento
                </div>
                <button
                  className="pl-modal-close"
                  onClick={() => setSelectedProof(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#5A7A70", fontSize: 18, lineHeight: 1, transition: "color 0.15s" }}
                >
                  ✕
                </button>
              </div>
              {selectedProof.endsWith(".pdf") ? (
                <div style={{ background: "#111614", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1.5rem", textAlign: "center" }}>
                  <p style={{ fontSize: 12, color: "#5A7A70", marginBottom: "1rem" }}>Arquivo PDF</p>
                  <a href={selectedProof} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#00C896", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    <Download size={14} /> Baixar PDF
                  </a>
                </div>
              ) : (
                <img src={selectedProof} alt="Comprovante" style={{ width: "100%", borderRadius: 10 }} />
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}