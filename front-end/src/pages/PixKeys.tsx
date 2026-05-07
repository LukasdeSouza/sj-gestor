import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { PopupCreatePixKey } from "@/components/Pixkey/PopUpCreatePixkey";
import { PopupAlterPixKey } from "@/components/Pixkey/PopUpAlterPixKey";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { PixKeysResponse } from "@/api/models/pixKeys";
import { Trash2, Search, CreditCard, Save, ExternalLink, Info } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { AuthUser } from "@/api/models/auth";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { PopupConnectGateway } from "@/components/Pixkey/PopupConnectGateway";

// ─── KEY TYPE CHIP ────────────────────────────────────────────────────────────

const KEY_TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  cpf: { bg: "rgba(99,102,241,0.1)", color: "#818CF8", border: "rgba(99,102,241,0.2)" },
  cnpj: { bg: "rgba(245,158,11,0.1)", color: "#F5A623", border: "rgba(245,158,11,0.2)" },
  email: { bg: "rgba(0,200,150,0.08)", color: "#00C896", border: "rgba(0,200,150,0.2)" },
  phone: { bg: "rgba(180,130,220,0.1)", color: "#B482DC", border: "rgba(180,130,220,0.2)" },
  random: { bg: "rgba(100,150,220,0.1)", color: "#6496DC", border: "rgba(100,150,220,0.2)" },
};

function KeyTypeBadge({ type }: { type: string }) {
  const c = KEY_TYPE_COLORS[type.toLowerCase()] ?? {
    bg: "rgba(255,255,255,0.06)", color: "#7A9087", border: "rgba(255,255,255,0.1)",
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 100, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {type}
    </span>
  );
}

// ─── LINKS SETTINGS ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", height: 42, boxSizing: "border-box",
  background: "#FFFFFF", border: "1px solid #E2E8F0",
  borderRadius: 8, color: "#0F172A", fontSize: 13,
  fontFamily: " 'Montserrat', sans-serif", padding: "0 12px",
  outline: "none", transition: "border-color 0.2s",
};

function PaymentLinksSection() {
  const user: AuthUser = JSON.parse(Cookies.get("user") ?? "{}");
  const qc = useQueryClient();

  const [card, setCard] = useState("");

  const { data } = useQuery({
    queryKey: ["userPaymentLinks", user?.id],
    queryFn: async () => {
      const res = await fetchUseQuery<undefined, any>({ route: `/users/${user.id}`, method: "GET" });
      return { payment_link_card: res?.data?.payment_link_card ?? "" };
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setCard(data.payment_link_card ?? "");
    }
  }, [data]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      await fetchUseQuery<any, any>({
        route: `/users/${user.id}`,
        method: "PATCH",
        data: { payment_link_card: card || null },
      });
    },
    onSuccess: () => {
      toast.success("Links de pagamento salvos!");
      qc.invalidateQueries({ queryKey: ["userPaymentLinks", user?.id] });
    },
    onError: () => toast.error("Erro ao salvar links."),
  });

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "1.5rem", marginTop: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", fontFamily: "'Montserrat', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <ExternalLink size={15} color="#818CF8" />
          Link de Pagamento Externo
        </h2>
        <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>
          Cole aqui o link do seu checkout no Stripe, Mercado Pago, PagSeguro, etc. Ele será exibido como opção na página de cobrança dos seus clientes.
        </p>
      </div>

      <div>
        <input
          type="url"
          placeholder="https://checkout.stripe.com/... ,link do Mercado Pago, link de pagamento, etc"
          value={card}
          onChange={e => setCard(e.target.value)}
          style={INPUT_STYLE}
        />
      </div>

      {/* Aviso */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12,
        background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)",
        borderRadius: 8, padding: "10px 12px",
      }}>
        <Info size={13} color="#F5A623" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.5 }}>
          O valor da cobrança <strong style={{ color: "#D97706" }}>não é aplicado automaticamente</strong> neste link. Para cobranças com valor exato, use as chaves PIX acima ou as integrações de Gateway abaixo.
        </p>
      </div>

      <button
        onClick={() => save()}
        disabled={isPending}
        style={{
          marginTop: 16, display: "inline-flex", alignItems: "center", gap: 7,
          background: isPending ? "rgba(0,200,150,0.5)" : "#00C896",
          color: "#FFFFFF", border: "none", borderRadius: 8,
          padding: "8px 16px", fontSize: 13, fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        <Save size={14} />
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

// ─── GATEWAY INTEGRATIONS ────────────────────────────────────────────────────

function GatewayIntegrationsSection() {
  const user: AuthUser = JSON.parse(Cookies.get("user") ?? "{}");
  const qc = useQueryClient();

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ["userGateways", user?.id],
    queryFn: async () => {
      const res = await fetchUseQuery<undefined, any[]>({ route: `/users/${user.id}/gateways`, method: "GET" });
      return res || [];
    },
    enabled: !!user?.id,
  });

  const getGateway = (name: string) => gateways.find((g) => g.gateway_name === name);

  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: async (id: string) => fetchUseQuery({ route: `/users/${user.id}/gateways/${id}`, method: "DELETE" }),
    onSuccess: () => {
      toast.success("Gateway desconectado.");
      qc.invalidateQueries({ queryKey: ["userGateways", user?.id] });
    }
  });

  const { mutate: toggleActive, isPending: isToggling } = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      if (active) {
        return fetchUseQuery({ route: `/users/${user.id}/gateways/${id}/activate`, method: "PATCH" });
      } else {
        return fetchUseQuery({ route: `/users/${user.id}/gateways/deactivateAll`, method: "PATCH" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userGateways", user?.id] });
    }
  });

  const GatewayCard = ({ name, label, logoUrl, desc, instructionsUrl }: { name: string, label: string, logoUrl: string, desc: string, instructionsUrl?: string }) => {
    const gw = getGateway(name);
    const isConnected = !!gw;
    const isActive = isConnected && gw.is_active;

    return (
      <div style={{
        background: isActive ? "rgba(0,200,150,0.03)" : "var(--bg)", border: `1px solid ${isActive ? "var(--cobr)" : "var(--border)"}`,
        borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16,
        transition: "all 0.2s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", padding: 8 }}>
            <img src={logoUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text1)", margin: "0 0 4px" }}>{label}</h3>
            {isConnected ? (
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#00C896", background: "rgba(0,200,150,0.1)", padding: "3px 8px", borderRadius: 100, textTransform: "uppercase" }}>Conectado</span>
            ) : (
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text2)", background: "var(--border)", padding: "3px 8px", borderRadius: 100, textTransform: "uppercase" }}>Desconectado</span>
            )}
          </div>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--text2)", margin: 0, lineHeight: 1.4, flex: 1 }}>{desc}</p>

        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {!isConnected ? (
            <PopupConnectGateway gatewayName={name} gatewayLabel={label} instructionsUrl={instructionsUrl}>
              <button style={{ flex: 1, background: "var(--text, #0F172A)", color: "var(--bg2, #FFFFFF)", border: "none", borderRadius: 8, padding: "10px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}>
                Conectar
              </button>
            </PopupConnectGateway>
          ) : (
            <>
              <button
                onClick={() => toggleActive({ id: gw.id, active: !isActive })}
                disabled={isToggling}
                style={{ flex: 1, background: isActive ? "var(--bg2)" : "var(--cobr)", color: isActive ? "var(--text2)" : "#fff", border: `1px solid ${isActive ? "var(--border)" : "transparent"}`, borderRadius: 8, padding: "10px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", transition: "0.2s" }}
              >
                {isActive ? "Pausar" : "Ativar"}
              </button>
              <button
                onClick={() => { if (confirm("Deseja realmente remover a integração?")) disconnect(gw.id); }}
                disabled={isDisconnecting}
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginTop: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text1)", margin: "0 0 4px", fontFamily: "'Montserrat', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={15} color="#3b82f6" />
          Integrações de Gateway API (Beta)
        </h2>
        <p style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>
          Conecte sua conta para gerar cobranças automáticas (PIX, Boleto, Cartão) via API diretamente na plataforma.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <GatewayCard
          name="mercadopago"
          label="Mercado Pago"
          logoUrl="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png"
          desc="Gere links de pagamento e PIX dinâmicos utilizando o seu Access Token de produção do Mercado Pago."
          instructionsUrl="https://www.mercadopago.com.br/developers/pt/reference"
        />
        <GatewayCard
          name="asaas"
          label="Asaas"
          logoUrl="https://s2-pegn.glbimg.com/totr23XhoF0c_X3wDF0lAkZxEE4=/600x0/filters:quality(50)/https://i.s3.glbimg.com/v1/AUTH_ba41d7b1ff5f48b28d3c5f84f30a06af/internal_photos/bs/2024/7/t/tYmYM8RbGPMYEiKIGKPg/home-phbm-startups-crudstartups-logos-asaas.jpeg"
          desc="Emita boletos, carnês e PIX direto na conta do seu cliente utilizando a API Key do Asaas."
        />
        <GatewayCard
          name="pagseguro"
          label="PagSeguro"
          logoUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn_qbIt42L8ilaF_PcnnlSepHJsG9Uh1pigg&s"
          desc="Integração via API para emissão rápida de links de checkout transparente. (Em breve)"
        />
      </div>
    </div>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function MeiosPagamentoContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data: dataPixKeys, isLoading: isloadingPixKeys, isFetching, refetch } = useQuery<PixKeysResponse>({
    queryKey: ["listPixKeys", parsedUser?.id, debouncedSearch, page, limit],
    queryFn: async () =>
      fetchUseQuery<{ user_id: string; name?: string; page: number; limit: number }, PixKeysResponse>({
        route: "/pix_keys",
        method: "GET",
        data: { user_id: parsedUser.id, name: debouncedSearch || undefined, page, limit },
      }),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser?.id,
  });

  const totalPages = useMemo(() => dataPixKeys?.totalPaginas ?? 1, [dataPixKeys]);
  const currentPage = useMemo(() => dataPixKeys?.pagina ?? page, [dataPixKeys, page]);
  const keys = dataPixKeys?.keys ?? [];

  const { mutate: mutateDelete, isPending: isloadingDataDelete } = useMutation({
    mutationFn: async (id: string) =>
      fetchUseQuery({ route: `/pix_keys/${id}`, method: "DELETE" }),
    onSuccess: () => { toast.success("Deletado com sucesso!"); refetch(); },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  if (isloadingPixKeys) return <SkeletonInformation />;

  // ─── styles ──────────────────────────────────────────────────────────────

  const S: Record<string, React.CSSProperties> = {
    wrap: { display: "flex", flexDirection: "column", gap: 20, padding: "1.75rem", fontFamily: " 'Montserrat', sans-serif", color: "#0F172A" },
    header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
    title: { fontFamily: "'Montserrat', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#0F172A", letterSpacing: -0.5, margin: "0 0 3px" },
    sub: { fontSize: "0.8rem", color: "#64748B", margin: 0 },

    toolbar: { position: "relative" as const },
    searchIcon: { position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748B", pointerEvents: "none" as const },
    searchInput: { width: "100%", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: "0.55rem 0.85rem 0.55rem 2.2rem", color: "#0F172A", fontSize: 13, fontFamily: " 'Montserrat', sans-serif", outline: "none" },

    tableWrap: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" },
    th: { fontWeight: 700, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "#64748B" },

    monoVal: { fontFamily: "monospace", fontSize: 13, color: "#0F172A", letterSpacing: 0.3 },
    labelVal: { fontSize: 13, color: "#64748B" },

    pg: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #F1F5F9" },
    pgInfo: { fontSize: 12, color: "#64748B" },
    pgBtns: { display: "flex", gap: 6 },

    emptyWrap: { textAlign: "center" as const, padding: "3rem 1rem", color: "#64748B" },
    emptyIcon: { margin: "0 auto 10px", opacity: 0.35, display: "block" },
    emptyText: { fontSize: 13, margin: 0 },
  };

  const pgBtn = (disabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: `1px solid ${disabled ? "#F1F5F9" : "#E2E8F0"}`,
    color: disabled ? "#94A3B8" : "#64748B",
    borderRadius: 8, padding: "5px 12px", fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: " 'Montserrat', sans-serif",
    transition: "border-color 0.15s, color 0.15s",
  });

  const btnDel: React.CSSProperties = {
    background: "none", border: "1px solid #E2E8F0",
    color: "#64748B", borderRadius: 7, padding: "5px 7px",
    cursor: "pointer", display: "inline-flex", alignItems: "center",
    transition: "border-color 0.15s, color 0.15s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .px-search:focus { border-color: rgba(0,200,150,0.35) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; }
        .px-search::placeholder { color: #94A3B8; }
        .px-row { transition: background 0.15s; }
        .px-row:hover { background: rgba(0,200,150,0.03) !important; }
        .px-del:hover { border-color: rgba(232,69,69,0.3) !important; color: #E84545 !important; }
        .px-pg-btn:hover:not(:disabled) { border-color: rgba(0,200,150,0.3) !important; color: #00C896 !important; }
      `}</style>

      <div style={S.wrap}>

        {/* ── HEADER ── */}
        <div style={S.header}>
          <div>
            <h1 style={S.title}>Meios de Pagamento</h1>
            <p style={S.sub}>
              Gerencie suas chaves PIX e links de checkout externos.
            </p>
          </div>
          <PopupCreatePixKey onSuccess={() => refetch()} />
        </div>

        {/* ── SEARCH ── */}
        <div style={S.toolbar}>
          <span style={S.searchIcon}><Search size={14} /></span>
          <input
            className="px-search"
            style={S.searchInput}
            placeholder="Buscar chaves PIX..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ── TABLE ── */}
        <div style={S.tableWrap}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid #F1F5F9" }}>
                <TableHead style={{ ...S.th, paddingLeft: 20 }}>Tipo</TableHead>
                <TableHead style={S.th}>Chave</TableHead>
                <TableHead style={S.th}>Identificação</TableHead>
                <TableHead style={{ ...S.th, textAlign: "right", paddingRight: 20 }}>Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div style={S.emptyWrap}>
                      <CreditCard size={28} style={S.emptyIcon} />
                      <p style={S.emptyText}>
                        {searchTerm ? "Nenhuma chave encontrada para esta busca." : "Nenhuma chave PIX cadastrada ainda."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : keys.map((key) => (
                <TableRow
                  key={key.id}
                  className="px-row"
                  style={{ borderBottom: "1px solid #F1F5F9" }}
                >
                  <TableCell style={{ paddingLeft: 20 }}>
                    <KeyTypeBadge type={key.key_type} />
                  </TableCell>

                  <TableCell>
                    <span style={S.monoVal}>{key.key_value}</span>
                  </TableCell>

                  <TableCell>
                    <span style={S.labelVal}>{key.label || "—"}</span>
                  </TableCell>

                  <TableCell style={{ textAlign: "right", paddingRight: 20 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                      <PopupAlterPixKey id={key.id} onSuccess={() => refetch()} />
                      <button
                        className="px-del"
                        style={btnDel}
                        onClick={() => mutateDelete(key.id)}
                        disabled={isloadingDataDelete}
                        title="Remover chave"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div style={S.pg}>
            <span style={S.pgInfo}>
              Página {currentPage} de {totalPages}
              {(dataPixKeys?.resultados ?? 0) > 0 && ` · ${dataPixKeys?.resultados} total`}
            </span>
            <div style={S.pgBtns}>
              <button
                className="px-pg-btn"
                style={pgBtn(currentPage <= 1 || isFetching)}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetching}
              >
                Anterior
              </button>
              <button
                className="px-pg-btn"
                style={pgBtn(currentPage >= totalPages || isFetching)}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isFetching}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

        <GatewayIntegrationsSection />
        <PaymentLinksSection />


      </div>
    </>
  );
}

export default function MeiosPagamento() {
  return (
    <DashboardLayout>
      <MeiosPagamentoContent />
    </DashboardLayout>
  );
}
