import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { PopupCreatePixKey } from "@/components/Pixkey/PopUpCreatePixkey";
import { PopupAlterPixKey } from "@/components/Pixkey/PopUpAlterPixKey";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { PixKeysResponse } from "@/api/models/pixKeys";
import { Trash2, Search, Wallet, Plus, CreditCard, Banknote, ExternalLink, Save, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { AuthUser } from "@/api/models/auth";
import Cookies from "js-cookie";
import { toast } from "sonner";

// ─── KEY TYPE CHIP ────────────────────────────────────────────────────────────

const KEY_TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  cpf:    { bg: "rgba(99,102,241,0.1)",  color: "#818CF8", border: "rgba(99,102,241,0.2)"  },
  cnpj:   { bg: "rgba(245,158,11,0.1)",  color: "#F5A623", border: "rgba(245,158,11,0.2)"  },
  email:  { bg: "rgba(0,200,150,0.08)",  color: "#00C896", border: "rgba(0,200,150,0.2)"   },
  phone:  { bg: "rgba(180,130,220,0.1)", color: "#B482DC", border: "rgba(180,130,220,0.2)" },
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
      fontSize: 11, fontWeight: 700, fontFamily: "'Syne', sans-serif",
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {type}
    </span>
  );
}

// ─── LINKS SETTINGS ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", height: 42, boxSizing: "border-box",
  background: "#111614", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#F0F5F2", fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", padding: "0 12px",
  outline: "none", transition: "border-color 0.2s",
};

function PaymentLinksSection() {
  const user: AuthUser = JSON.parse(Cookies.get("user") ?? "{}");
  const qc = useQueryClient();

  const [card,   setCard]   = useState("");
  const [boleto, setBoleto] = useState("");

  const { data } = useQuery({
    queryKey: ["userPaymentLinks", user?.id],
    queryFn: async () => {
      const res = await fetchUseQuery<undefined, any>({ route: `/users/${user.id}`, method: "GET" });
      return { 
        payment_link_card: res?.data?.payment_link_card ?? "", 
        payment_link_boleto: res?.data?.payment_link_boleto ?? "" 
      };
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setCard(data.payment_link_card   ?? "");
      setBoleto(data.payment_link_boleto ?? "");
    }
  }, [data]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      await fetchUseQuery<any, any>({
        route: `/users/${user.id}`,
        method: "PATCH",
        data: {
          payment_link_card:   card   || null,
          payment_link_boleto: boleto || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Links de pagamento salvos!");
      qc.invalidateQueries({ queryKey: ["userPaymentLinks", user?.id] });
    },
    onError: () => toast.error("Erro ao salvar links."),
  });

  return (
    <div style={{ background: "#0D110F", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "1.5rem", marginTop: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#F0F5F2", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" }}>
          Links de Checkout (Cartão e Boleto)
        </h2>
        <p style={{ fontSize: 12, color: "#5A7A70", margin: 0 }}>
          Configure links externos de checkout. Eles serão exibidos como opções na sua página de recebimento.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Card */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <CreditCard size={14} color="#818CF8" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#7A9087" }}>Cartão de Crédito</span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="url"
              placeholder="Link do checkout (ex: Mercado Pago, Stripe)"
              value={card}
              onChange={e => setCard(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Boleto */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <Banknote size={14} color="#F5A623" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#7A9087" }}>Boleto Bancário</span>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="url"
              placeholder="Link do boleto (ex: Asaas, Iugu)"
              value={boleto}
              onChange={e => setBoleto(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => save()}
        disabled={isPending}
        style={{
          marginTop: 20, display: "inline-flex", alignItems: "center", gap: 7,
          background: isPending ? "rgba(0,200,150,0.5)" : "#00C896",
          color: "#051A12", border: "none", borderRadius: 8,
          padding: "8px 16px", fontSize: 13, fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        <Save size={14} />
        {isPending ? "Salvando..." : "Salvar Links"}
      </button>
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

  const totalPages  = useMemo(() => dataPixKeys?.totalPaginas ?? 1, [dataPixKeys]);
  const currentPage = useMemo(() => dataPixKeys?.pagina ?? page, [dataPixKeys, page]);
  const keys        = dataPixKeys?.keys ?? [];

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
    wrap:    { display: "flex", flexDirection: "column", gap: 20, padding: "1.75rem", fontFamily: "'DM Sans', sans-serif", color: "#F0F5F2" },
    header:  { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
    title:   { fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.5, margin: "0 0 3px" },
    sub:     { fontSize: "0.8rem", color: "#5A7A70", margin: 0 },

    toolbar: { position: "relative" as const },
    searchIcon: { position: "absolute" as const, left: 10, top: "50%", transform: "translateY(-50%)", color: "#3A5A50", pointerEvents: "none" as const },
    searchInput: { width: "100%", background: "#111614", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.55rem 0.85rem 0.55rem 2.2rem", color: "#F0F5F2", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none" },

    tableWrap: { background: "#111614", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" },
    th:        { fontWeight: 700, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.8, color: "#3A5A50" },

    monoVal:  { fontFamily: "monospace", fontSize: 13, color: "#C0D5CC", letterSpacing: 0.3 },
    labelVal: { fontSize: 13, color: "#7A9087" },

    pg:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" },
    pgInfo:  { fontSize: 12, color: "#3A5A50" },
    pgBtns:  { display: "flex", gap: 6 },

    emptyWrap: { textAlign: "center" as const, padding: "3rem 1rem", color: "#3A5A50" },
    emptyIcon: { margin: "0 auto 10px", opacity: 0.35, display: "block" },
    emptyText: { fontSize: 13, margin: 0 },
  };

  const pgBtn = (disabled: boolean): React.CSSProperties => ({
    background: "transparent",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}`,
    color: disabled ? "#2A4A40" : "#5A7A70",
    borderRadius: 8, padding: "5px 12px", fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, color 0.15s",
  });

  const btnDel: React.CSSProperties = {
    background: "none", border: "1px solid rgba(255,255,255,0.07)",
    color: "#3A5A50", borderRadius: 7, padding: "5px 7px",
    cursor: "pointer", display: "inline-flex", alignItems: "center",
    transition: "border-color 0.15s, color 0.15s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .px-search:focus { border-color: rgba(0,200,150,0.35) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; }
        .px-search::placeholder { color: #2A4A40; }
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
              <TableRow style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
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