import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PopUpRegisterPayment } from "@/components/Client/PopUpRegisterPayment";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { PopupCreateClient } from "@/components/Client/PopUpCreateClient";
import { PopupAlterClient } from "@/components/Client/PopUpAlterClient";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { BillingStatusBadge } from "@/components/Client/BillingStatusBadge";
import { Client, ClientsResponse } from "@/api/models/clients";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPhoneNumber } from "@/utils/mask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthUser } from "@/api/models/auth";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Trash2, Search, CheckCircle2, Clock, X, InfoIcon,
  Plus, AlertCircle, Send, Zap, Phone,
  CreditCard, ChevronRight, Users, Activity, MessageCircle,
} from "lucide-react";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function getDaysOverdue(dueAt: string | Date) {
  return Math.floor((Date.now() - new Date(dueAt).getTime()) / 86400000);
}

function formatCurrency(value?: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateShort(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatDateTime(dateStr: string | Date) {
  return new Date(dateStr).toLocaleString("pt-BR");
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  ["#00C896", "#00a07a"], ["#6366f1", "#4f46e5"], ["#f59e0b", "#d97706"],
  ["#ec4899", "#db2777"], ["#14b8a6", "#0d9488"], ["#8b5cf6", "#7c3aed"],
];

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 800, color: "#fff", flexShrink: 0,
      letterSpacing: -0.5, fontFamily: "'Syne', sans-serif",
    }}>
      {getInitials(name)}
    </div>
  );
}

// ─── STATUS CHIP ─────────────────────────────────────────────────────────────

function StatusChip({ client, lastPaymentAt }: { client: Client; lastPaymentAt?: string | null }) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4,
    borderRadius: 100, padding: "3px 9px", fontSize: 12, fontWeight: 600,
    whiteSpace: "nowrap",
  };

  // If there's a payment after due_at → paid this cycle
  if (lastPaymentAt && client.due_at) {
    const paymentDate = new Date(lastPaymentAt);
    const dueDate = new Date(client.due_at);
    // Payment on or after the due date (within the same billing cycle)
    const cycleStart = new Date(dueDate);
    cycleStart.setDate(cycleStart.getDate() - 10); // lookback window
    if (paymentDate >= cycleStart) {
      return (
        <span style={{ ...base, background: "rgba(0,200,150,0.1)", color: "#00C896", border: "1px solid rgba(0,200,150,0.25)" }}>
          <CheckCircle2 size={10} />
          Pago
        </span>
      );
    }
  }

  const isOverdue = client.due_at && new Date(client.due_at) < new Date();
  const days = isOverdue ? getDaysOverdue(client.due_at) : 0;

  if (isOverdue) return (
    <span style={{ ...base, background: "rgba(232,69,69,0.1)", color: "#E84545", border: "1px solid rgba(232,69,69,0.2)" }}>
      <AlertCircle size={10} />
      {days === 0 ? "Vence hoje" : `${days}d atraso`}
    </span>
  );

  if (client.due_at) {
    const daysUntil = Math.ceil((new Date(client.due_at).getTime() - Date.now()) / 86400000);
    if (daysUntil <= 3) return (
      <span style={{ ...base, background: "rgba(245,158,11,0.1)", color: "#F5A623", border: "1px solid rgba(245,158,11,0.2)" }}>
        <Clock size={10} />
        Vence em {daysUntil}d
      </span>
    );
    return (
      <span style={{ ...base, background: "rgba(0,200,150,0.08)", color: "#00C896", border: "1px solid rgba(0,200,150,0.2)" }}>
        <CheckCircle2 size={10} />
        Em dia
      </span>
    );
  }

  return <span style={{ color: "#4A6A60", fontSize: 13 }}>—</span>;
}

// ─── CLIENT MODAL ─────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<string, { label: string; color: string }> = {
  pix:      { label: "PIX",          color: "#00C896" },
  card:     { label: "Cartão",       color: "#6366f1" },
  cash:     { label: "Dinheiro",     color: "#F5A623" },
  transfer: { label: "Transferência",color: "#14b8a6" },
  other:    { label: "Outro",        color: "#8b5cf6" },
};

type ClientPaymentsResponse = {
  payments: { id: string; paid_at: string; amount?: number | null; note?: string | null; payment_method?: string | null }[];
  pagina: number; totalPaginas: number; limite: number; resultados: number;
};

type LastPayment = { paid_at: string; amount?: number | null; payment_method?: string | null } | null;

function ClientModal({
  client, open, onClose, onPaymentSuccess, onEditSuccess,
  onDeletePayment, isDeletingPayment,
}: {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onEditSuccess: () => void;
  onDeletePayment: (id: string) => void;
  isDeletingPayment: boolean;
}) {
  const [paymentsPage, setPaymentsPage] = useState(1);

  const { data: dataPayments, isFetching, refetch: refetchPayments } = useQuery<ClientPaymentsResponse>({
    queryKey: ["clientPayments", client?.id, paymentsPage],
    queryFn: async () => fetchUseQuery<undefined, ClientPaymentsResponse>({
      route: `/clients/${client?.id}/payments?page=${paymentsPage}&limit=5`,
      method: "GET",
    }),
    enabled: open && !!client?.id,
    refetchOnWindowFocus: false,
  });

  const { data: lastPaymentData, refetch: refetchLast } = useQuery<LastPayment>({
    queryKey: ["lastPayment", client?.id],
    queryFn: async () => {
      try {
        const res = await fetchUseQuery<undefined, { data: LastPayment }>({
          route: `/clients/${client?.id}/payments/last`,
          method: "GET",
        });
        return (res as any).data ?? null;
      } catch { return null; }
    },
    enabled: open && !!client?.id,
    refetchOnWindowFocus: false,
  });

  function handlePaymentSuccess() {
    refetchPayments();
    refetchLast();
    onPaymentSuccess();
  }

  if (!client) return null;

  const isOverdue = client.due_at && new Date(client.due_at) < new Date();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: 640, padding: 0, overflow: "hidden", borderRadius: 20, background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)" }}>
        <DialogTitle style={{ display: "none" }}>Detalhes do Cliente</DialogTitle>

        {/* Header */}
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
            <Avatar name={client.name} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "'Syne', sans-serif", color: "#F0F5F2" }}>{client.name}</h2>
                <StatusChip client={client} lastPaymentAt={lastPaymentData?.paid_at} />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#5A7A70" }}>
                  <Phone size={11} /> {formatPhoneNumber(client.phone)}
                </span>
                {client.email && <span style={{ fontSize: 13, color: "#5A7A70" }}>{client.email}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              {
                icon: CreditCard, label: "Vencimento",
                value: client.due_at ? formatDateShort(client.due_at) : "—",
                accent: isOverdue ? "#E84545" : "#00C896",
              },
              {
                icon: Send, label: "Último disparo",
                value: client.last_reminder_due_at ? formatDateShort(client.last_reminder_due_at) : "Nunca",
                accent: client.last_reminder_due_at ? "#00C896" : "#F5A623",
              },
              {
                icon: CheckCircle2, label: "Último pagamento",
                value: lastPaymentData?.paid_at ? formatDateShort(lastPaymentData.paid_at) : "—",
                accent: lastPaymentData?.paid_at ? "#00C896" : "#3A5A50",
              },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <m.icon size={11} color={m.accent} />
                  <span style={{ fontSize: 10, color: "#3A5A50", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#C0D5CC" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 20, maxHeight: "58vh", overflowY: "auto" }}>

          {/* Régua */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6, color: "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>
                <Zap size={13} color="#00C896" /> Régua de Cobrança
              </h3>
              <BillingStatusBadge clientId={client.id} clientName={client.name} />
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#3A5A50", marginBottom: 10 }}>Fluxo de lembretes automáticos</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[{ label: "D-3", desc: "Aviso" }, { label: "D0", desc: "Venc." }, { label: "D+3", desc: "Follow" }, { label: "D+7", desc: "Follow" }].map((s, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: i === 1 ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.04)",
                        border: `2px solid ${i === 1 ? "#00C896" : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, fontWeight: 700, color: i === 1 ? "#00C896" : "#3A5A50",
                        fontFamily: "'Syne', sans-serif",
                      }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: "#3A5A50", marginTop: 4 }}>{s.desc}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, width: 16, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />}
                  </div>
                ))}
              </div>
            </div>
            {client.last_reminder_due_at && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "9px 12px", background: "rgba(0,200,150,0.05)", border: "1px solid rgba(0,200,150,0.12)", borderRadius: 9 }}>
                <CheckCircle2 size={13} color="#00C896" />
                <span style={{ fontSize: 12, color: "#C0D5CC" }}>
                  Último disparo em <strong>{formatDateTime(client.last_reminder_due_at)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Observações */}
          {(client.observacoes1 || client.observacoes2) && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6, color: "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>
                <InfoIcon size={13} color="#6366f1" /> Observações
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[client.observacoes1, client.observacoes2].filter(Boolean).map((obs, i) => (
                  <div key={i} style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.12)", borderRadius: 9, padding: "9px 12px" }}>
                    <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>Obs. {i + 1}</div>
                    <div style={{ fontSize: 13, color: "#C0D5CC" }}>{obs}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator style={{ background: "rgba(255,255,255,0.06)" }} />

          {/* Histórico */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6, color: "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>
                <Activity size={13} color="#00C896" /> Histórico de Pagamentos
              </h3>
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="outline" size="sm" disabled={paymentsPage <= 1 || isFetching} onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={!dataPayments || paymentsPage >= (dataPayments.totalPaginas ?? 1) || isFetching} onClick={() => setPaymentsPage((p) => p + 1)}>Próxima</Button>
              </div>
            </div>

            {(dataPayments?.payments ?? []).length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                <CreditCard size={24} style={{ color: "#3A5A50", marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: "#3A5A50", margin: 0 }}>Nenhum pagamento registrado</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {(dataPayments?.payments ?? []).map((p) => {
                  const method = p.payment_method ? PAYMENT_METHOD_LABELS[p.payment_method] : null;
                  return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.1)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,200,150,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={14} color="#00C896" />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#C0D5CC" }}>{formatDateTime(p.paid_at)}</span>
                          {method && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: method.color, background: method.color + "18", border: `1px solid ${method.color}44`, borderRadius: 100, padding: "1px 7px" }}>
                              {method.label}
                            </span>
                          )}
                        </div>
                        {p.note && <div style={{ fontSize: 11, color: "#5A7A70" }}>{p.note}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#00C896", fontFamily: "'Syne', sans-serif" }}>{formatCurrency(p.amount)}</span>
                      <button onClick={() => onDeletePayment(p.id)} disabled={isDeletingPayment}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#3A5A50", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", transition: "color 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#E84545")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#3A5A50")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 28px", display: "flex", gap: 10, justifyContent: "flex-end", background: "rgba(255,255,255,0.01)" }}>
          <PopUpRegisterPayment id={client.id} onSuccess={handlePaymentSuccess} />
          <PopupAlterClient id={client.id} onSuccess={onEditSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Clients() {
  const [searchTerm, setSearchTerm]       = useState("");
  const debouncedSearch                   = useDebounce(searchTerm, 500);
  const [page, setPage]                   = useState(1);
  const limit                             = 10;
  const [viewOpen, setViewOpen]           = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sortOrder, setSortOrder]         = useState<"asc" | "desc" | undefined>(undefined);
  const [dueDateOrder, setDueDateOrder]   = useState<"asc" | "desc" | undefined>(undefined);
  const [showOverdue, setShowOverdue]     = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const hasActiveFilters = !!sortOrder || !!dueDateOrder || showOverdue || !!searchTerm;

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: whatsapp } = useQuery<{ is_connected: boolean } | null>({
    queryKey: ["connectionWhatsApp"],
    queryFn: async () => fetchUseQuery<undefined, { is_connected: boolean } | null>({
      route: "/connect", method: "GET",
    }),
    retry: 0,
    staleTime: 60_000,
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription", "me"],
    queryFn: async () => fetchUseQuery<undefined, { plan_id: string; status: string; pix_qr_code?: string; approved_at?: string }>({
      route: "/subscription/me", method: "GET",
    }),
    retry: 0,
  });

  const { data: pendingPayments } = useQuery<{ count: number }>({
    queryKey: ["pendingPaymentsCount", parsedUser?.id],
    queryFn: async () => {
      try {
        const res = await fetchUseQuery<undefined, { data: { count: number } }>({
          route: "/clients/payments/pending/count",
          method: "GET",
        });
        return (res as any).data;
      } catch { return { count: 0 }; }
    },
    enabled: !!parsedUser?.id,
    refetchInterval: 1000 * 30, // update every 30 seconds
  });

  const { data: dataClients, isLoading: isloadingClients, isFetching, refetch } = useQuery<ClientsResponse>({
    queryKey: ["listClients", parsedUser?.id, debouncedSearch, page, limit],
    queryFn: async () => {
      const isPhoneSearch = /[\d\(\)\-\s\+]/.test(debouncedSearch);
      return fetchUseQuery<any, ClientsResponse>({
        route: "/clients", method: "GET",
        data: {
          user_id: parsedUser.id,
          ...(debouncedSearch ? (isPhoneSearch ? { phone: debouncedSearch } : { name: debouncedSearch }) : {}),
          page, limit,
        },
      });
    },
    retry: 2, refetchOnWindowFocus: false, enabled: !!parsedUser?.id,
  });

  const filteredClients = useMemo(() => {
    if (!dataClients?.clients) return [];
    let result = [...dataClients.clients];
    if (showOverdue) result = result.filter((c) => c.due_at && new Date(c.due_at) < new Date());
    if (sortOrder) result.sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    else if (dueDateOrder) result.sort((a, b) => {
      const da = a.due_at ? new Date(a.due_at).getTime() : 0;
      const db = b.due_at ? new Date(b.due_at).getTime() : 0;
      return dueDateOrder === "asc" ? da - db : db - da;
    });
    return result;
  }, [dataClients, showOverdue, sortOrder, dueDateOrder]);

  const totalPages    = useMemo(() => dataClients?.totalPaginas ?? 1, [dataClients]);
  const currentPage   = useMemo(() => dataClients?.pagina ?? page, [dataClients, page]);
  const overdueCount  = filteredClients.filter((c) => c.due_at && new Date(c.due_at) < new Date()).length;
  const dueTodayCount = filteredClients.filter((c) => {
    if (!c.due_at) return false;
    const d = new Date(c.due_at); const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;
  const ruleActiveCount = filteredClients.length; // placeholder — replace with real field if available

  const isPixSubscription = !!subscription?.pix_qr_code;
  const isApproved        = !!subscription?.approved_at;
  const isPlanEffective   = subscription?.status === "ACTIVE" && (!isPixSubscription || isApproved);
  const effectivePlanId   = isPlanEffective ? subscription?.plan_id : "FREE";
  const clientLimit       = effectivePlanId === "PRO_UNLIMITED" ? Infinity : effectivePlanId === "PRO_100" ? 100 : 5;
  const currentClientsCount = dataClients?.resultados || 0;
  const canAddClient      = currentClientsCount < clientLimit;

  const { mutate: mutateDelete, isPending: isloadingmutateDelete } = useMutation({
    mutationFn: async (id: string) => fetchUseQuery({ route: `/clients/${id}`, method: "DELETE" }),
    onSuccess: () => { toast.success("Cliente removido!"); refetch(); setDeleteConfirmOpen(false); },
    onError: (error: ApiErrorQuery) => { if (Array.isArray(error.errors)) handleErrorMessages(error.errors); },
  });

  const { mutate: mutateDeletePayment, isPending: isloadingmutateDeletePayment } = useMutation({
    mutationFn: async (id: string) => fetchUseQuery({ route: `/clients/payments/${id}`, method: "DELETE" }),
    onSuccess: () => { toast.success("Pagamento removido!"); refetch(); },
    onError: (error: ApiErrorQuery) => { if (Array.isArray(error.errors)) handleErrorMessages(error.errors); },
  });

  if (isloadingClients || isLoadingSubscription) return <SkeletonInformation />;

  // ── styles ──────────────────────────────────────────────────────────────────
  const S = {
    page: { display: "flex", flexDirection: "column", gap: 20 } as React.CSSProperties,

    // header
    pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 } as React.CSSProperties,
    pageTitle: { fontSize: 22, fontWeight: 800, margin: "0 0 3px", letterSpacing: -0.6, fontFamily: "'Syne', sans-serif", color: "#F0F5F2" } as React.CSSProperties,
    pageSub: { fontSize: 13, color: "#5A7A70", margin: 0 } as React.CSSProperties,

    // summary strip
    strip: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 } as React.CSSProperties,
    scard: { background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 10 } as React.CSSProperties,
    scardIcon: (bg: string): React.CSSProperties => ({ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
    scardLabel: { fontSize: 11, color: "#5A7A70", fontWeight: 500 } as React.CSSProperties,
    scardValue: { fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.5, lineHeight: 1 } as React.CSSProperties,

    // toolbar
    toolbar: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } as React.CSSProperties,
    searchWrap: { position: "relative", flex: 1, minWidth: 220 } as React.CSSProperties,
    searchIcon: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#3A5A50", pointerEvents: "none" } as React.CSSProperties,
    searchInput: { width: "100%", background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.55rem 0.85rem 0.55rem 2.1rem", color: "#F0F5F2", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" } as React.CSSProperties,

    // table
    tableWrap: { background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" } as React.CSSProperties,
    th: { fontWeight: 700, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "#3A5A50" },

    // pagination
    pgWrap: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" } as React.CSSProperties,
    pgInfo: { fontSize: 12, color: "#3A5A50" } as React.CSSProperties,
    pgBtns: { display: "flex", gap: 6 } as React.CSSProperties,
  };

  const filterBtn = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(0,200,150,0.1)" : "transparent",
    border: `1px solid ${active ? "rgba(0,200,150,0.3)" : "rgba(255,255,255,0.08)"}`,
    color: active ? "#00C896" : "#5A7A70",
    borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500,
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  });

  const btnView: React.CSSProperties = {
    background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)",
    color: "#00C896", borderRadius: 7, padding: "5px 10px",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center", gap: 4,
  };

  const btnDel: React.CSSProperties = {
    background: "none", border: "1px solid rgba(255,255,255,0.07)",
    color: "#3A5A50", borderRadius: 7, padding: "5px 7px",
    cursor: "pointer", display: "flex", alignItems: "center",
  };

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .cl-row { transition: background 0.15s; cursor: pointer; }
        .cl-row:hover { background: rgba(0,200,150,0.04) !important; }
        .cl-del-btn:hover { border-color: rgba(232,69,69,0.3) !important; color: #E84545 !important; }
        .cl-filter:hover { border-color: rgba(0,200,150,0.3) !important; color: #00C896 !important; }
        .cl-search:focus { border-color: rgba(0,200,150,0.35) !important; }
        .cl-search::placeholder { color: #2A4A40; }
        .cl-pg-btn:hover:not(:disabled) { border-color: rgba(0,200,150,0.3) !important; color: #00C896 !important; }
        .cl-pg-btn:disabled { opacity: 0.35 !important; cursor: not-allowed !important; }
      `}</style>

      <div style={S.page}>

        {/* ── WHATSAPP BANNER ── */}
        {whatsapp !== undefined && !whatsapp?.is_connected && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "12px 16px",
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(245,158,11,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={16} color="#F5A623" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#F5A623" }}>
                  WhatsApp não conectado
                </div>
                <div style={{ fontSize: 12, color: "#7A6A50", marginTop: 1 }}>
                  Sem conexão suas cobranças não serão enviadas automaticamente.
                </div>
              </div>
            </div>
            <Link to="/settings?tab=whatsapp" style={{ textDecoration: "none", flexShrink: 0 }}>
              <button style={{
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#F5A623", borderRadius: 8,
                padding: "7px 14px", fontSize: 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                Conectar agora →
              </button>
            </Link>
          </div>
        )}

        {/* ── PENDING PAYMENTS BANNER ── */}
        {pendingPayments && pendingPayments.count > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "12px 16px",
            background: "rgba(0, 200, 150, 0.07)",
            border: "1px solid rgba(0, 200, 150, 0.25)",
            borderRadius: 12,
            marginBottom: 4,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "rgba(0, 200, 150, 0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle2 size={16} color="#00C896" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#00C896" }}>
                  Você tem {pendingPayments.count} pagamento{pendingPayments.count !== 1 ? "s" : ""} pendente{pendingPayments.count !== 1 ? "s" : ""} de confirmação
                </div>
                <div style={{ fontSize: 12, color: "#5A7A70", marginTop: 1 }}>
                  Seus clientes confirmaram o pagamento pelo link público. Verifique a listagem.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={S.pageHeader}>
          <div>
            <h1 style={S.pageTitle}>Cobranças</h1>
            <p style={S.pageSub}>
              {currentClientsCount} cliente{currentClientsCount !== 1 ? "s" : ""}
              {overdueCount > 0 && (
                <span style={{ color: "#E84545", fontWeight: 600, marginLeft: 8 }}>
                  · {overdueCount} inadimplente{overdueCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          {canAddClient ? (
            <PopupCreateClient onSuccess={() => refetch()} />
          ) : (
            <Button onClick={() => toast.error("Limite de clientes atingido. Faça upgrade para adicionar mais.")}>
              <Plus size={14} style={{ marginRight: 6 }} /> Novo Cliente
            </Button>
          )}
        </div>

        {/* ── SUMMARY STRIP ── */}
        <div style={S.strip}>
          {[
            { label: "Total de clientes", value: currentClientsCount, color: "#00C896", bg: "rgba(0,200,150,0.1)", icon: <Users size={15} color="#00C896" /> },
            { label: "Inadimplentes",     value: overdueCount,        color: "#E84545", bg: "rgba(232,69,69,0.1)", icon: <AlertCircle size={15} color="#E84545" /> },
            { label: "Vencem hoje",       value: dueTodayCount,       color: "#F5A623", bg: "rgba(245,166,35,0.1)", icon: <Clock size={15} color="#F5A623" /> },
            { label: "Com régua ativa",   value: ruleActiveCount,     color: "#00C896", bg: "rgba(0,200,150,0.1)", icon: <Zap size={15} color="#00C896" /> },
          ].map((s) => (
            <div key={s.label} style={S.scard}>
              <div style={S.scardIcon(s.bg)}>{s.icon}</div>
              <div>
                <div style={S.scardLabel}>{s.label}</div>
                <div style={{ ...S.scardValue, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div style={S.toolbar}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}><Search size={14} /></span>
            <input
              className="cl-search"
              style={S.searchInput}
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {[
            {
              label: sortOrder ? `A-Z ${sortOrder === "asc" ? "↑" : "↓"}` : "A-Z",
              active: !!sortOrder,
              onClick: () => { setSortOrder((s) => s === "asc" ? "desc" : "asc"); setDueDateOrder(undefined); setShowOverdue(false); },
            },
            {
              label: dueDateOrder ? `Vencimento ${dueDateOrder === "asc" ? "↑" : "↓"}` : "Vencimento",
              active: !!dueDateOrder,
              onClick: () => { setDueDateOrder((d) => d === "asc" ? "desc" : "asc"); setSortOrder(undefined); setShowOverdue(false); },
            },
            {
              label: `Inadimplentes${showOverdue && overdueCount > 0 ? ` (${overdueCount})` : ""}`,
              active: showOverdue,
              onClick: () => { setShowOverdue((s) => !s); setSortOrder(undefined); setDueDateOrder(undefined); },
            },
          ].map((f, i) => (
            <button key={i} className="cl-filter" style={filterBtn(f.active)} onClick={f.onClick}>
              {f.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              className="cl-filter"
              style={{ ...filterBtn(false), borderColor: "rgba(232,69,69,0.2)", color: "#E84545" }}
              onClick={() => { setSortOrder(undefined); setDueDateOrder(undefined); setShowOverdue(false); setSearchTerm(""); }}
            >
              <X size={12} style={{ marginRight: 4 }} /> Limpar
            </button>
          )}
        </div>

        {/* ── TABLE ── */}
        <div style={S.tableWrap}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <TableHead style={{ ...S.th, paddingLeft: 20 }}>Cliente</TableHead>
                <TableHead style={S.th}>Situação</TableHead>
                <TableHead style={S.th}>Vencimento</TableHead>
                <TableHead style={S.th}>Último disparo</TableHead>
                <TableHead style={S.th}>Régua</TableHead>
                <TableHead style={{ ...S.th, textAlign: "right", paddingRight: 20 }}>Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredClients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "#3A5A50" }}>
                    <Users size={28} style={{ margin: "0 auto 10px", opacity: 0.4, display: "block" }} />
                    <p style={{ margin: 0, fontSize: 13 }}>
                      {searchTerm ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado ainda."}
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {filteredClients.map((client) => {
                const isOverdue = client.due_at && new Date(client.due_at) < new Date();
                return (
                  <TableRow
                    key={client.id}
                    className="cl-row"
                    onClick={() => { setSelectedClient(client); setViewOpen(true); }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    {/* Cliente */}
                    <TableCell style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={client.name} size={34} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#D0E5DC" }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: "#4A6A60" }}>{formatPhoneNumber(client.phone)}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Situação */}
                    <TableCell><StatusChip client={client} /></TableCell>

                    {/* Vencimento */}
                    <TableCell>
                      <span style={{ fontSize: 13, color: isOverdue ? "#E84545" : "#C0D5CC", fontWeight: isOverdue ? 600 : 400 }}>
                        {client.due_at ? formatDateShort(client.due_at) : "—"}
                      </span>
                    </TableCell>

                    {/* Último disparo */}
                    <TableCell>
                      {client.last_reminder_due_at ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#C0D5CC" }}>
                          <Send size={11} color="#00C896" />
                          {formatDateShort(client.last_reminder_due_at)}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#3A5A50" }}>
                          <Clock size={11} /> Nunca
                        </div>
                      )}
                    </TableCell>

                    {/* Régua */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <BillingStatusBadge clientId={client.id} clientName={client.name} />
                    </TableCell>

                    {/* Ações */}
                    <TableCell style={{ textAlign: "right", paddingRight: 20 }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
                        <button style={btnView} onClick={() => { setSelectedClient(client); setViewOpen(true); }}>
                          Ver detalhes <ChevronRight size={11} />
                        </button>
                        <button
                          className="cl-del-btn"
                          style={btnDel}
                          onClick={() => { setClientToDelete(client.id); setDeleteConfirmOpen(true); }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div style={S.pgWrap}>
            <span style={S.pgInfo}>
              Página {currentPage} de {totalPages}
              {currentClientsCount > 0 && ` · ${currentClientsCount} total`}
            </span>
            <div style={S.pgBtns}>
              <button className="cl-pg-btn" style={{ ...filterBtn(false), padding: "5px 12px", fontSize: 12 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1 || isFetching}>Anterior</button>
              <button className="cl-pg-btn" style={{ ...filterBtn(false), padding: "5px 12px", fontSize: 12 }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || isFetching}>Próxima</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CLIENT MODAL ── */}
      <ClientModal
        client={selectedClient}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        onPaymentSuccess={() => refetch()}
        onEditSuccess={() => refetch()}
        onDeletePayment={mutateDeletePayment}
        isDeletingPayment={isloadingmutateDeletePayment}
      />

      {/* ── DELETE CONFIRM ── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent style={{ maxWidth: 420, borderRadius: 16, background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)" }}>
          <DialogHeader>
            <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Syne', sans-serif", color: "#F0F5F2" }}>
              <AlertCircle size={16} color="#E84545" /> Remover cliente
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 13, color: "#5A7A70", margin: "8px 0 20px", lineHeight: 1.6 }}>
            Esta ação é irreversível. Todos os dados e histórico de pagamentos deste cliente serão removidos permanentemente.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => clientToDelete && mutateDelete(clientToDelete)} disabled={isloadingmutateDelete}>
              {isloadingmutateDelete ? "Removendo..." : "Sim, remover"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}