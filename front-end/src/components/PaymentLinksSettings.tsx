import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { CreditCard, Banknote, ExternalLink, Save, Info } from "lucide-react";
import Cookies from "js-cookie";
import { AuthUser } from "@/api/models/auth";

interface UserPaymentLinks {
  payment_link_card:   string | null;
  payment_link_boleto: string | null;
}

const INPUT: React.CSSProperties = {
  width: "100%", height: 42, boxSizing: "border-box",
  background: "#111614", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#F0F5F2", fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", padding: "0 12px",
  outline: "none", transition: "border-color 0.2s",
};

export function PaymentLinksSettings() {
  const user: AuthUser = JSON.parse(Cookies.get("user") ?? "{}");
  const qc = useQueryClient();

  const [card,   setCard]   = useState("");
  const [boleto, setBoleto] = useState("");

  const { data } = useQuery<UserPaymentLinks>({
    queryKey: ["userPaymentLinks", user?.id],
    queryFn: async () => {
      const res = await fetchUseQuery<undefined, any>({ route: `/users/${user.id}`, method: "GET" });
      return { payment_link_card: res?.data?.payment_link_card ?? "", payment_link_boleto: res?.data?.payment_link_boleto ?? "" };
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
    <div style={{ padding: "24px 28px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#F0F5F2", margin: "0 0 4px", fontFamily: "'Syne', sans-serif" }}>
          Links de pagamento
        </h2>
        <p style={{ fontSize: 12, color: "#5A7A70", margin: 0, lineHeight: 1.6 }}>
          Adicione links de checkout de cartão ou boleto. Eles aparecerão na página de pagamento enviada aos seus clientes.
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24,
        background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 10, padding: "12px 14px",
      }}>
        <Info size={14} color="#818CF8" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: "#818CF8", margin: 0, lineHeight: 1.6 }}>
          Cole aqui o link de pagamento gerado pelo seu provedor (Mercado Pago, Stripe, Asaas, PagSeguro, etc).
          O cliente clica e é redirecionado para o checkout deles.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Card link */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <CreditCard size={14} color="#818CF8" />
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7A9087" }}>
              Link de pagamento — Cartão
            </label>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="url"
              placeholder="https://mpago.la/seu-link-cartao"
              value={card}
              onChange={e => setCard(e.target.value)}
              style={{ ...INPUT, paddingRight: card ? 38 : 12 }}
              onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,0.4)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            {card && (
              <a href={card} target="_blank" rel="noopener noreferrer" style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "#5A7A70", display: "flex", alignItems: "center",
              }}>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#3A5A50", margin: "5px 0 0" }}>
            Ex.: link do Mercado Pago, Stripe Checkout, PagSeguro, etc.
          </p>
        </div>

        {/* Boleto link */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <Banknote size={14} color="#F5A623" />
            <label style={{ fontSize: 12, fontWeight: 600, color: "#7A9087" }}>
              Link de pagamento — Boleto
            </label>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="url"
              placeholder="https://boleto.asaas.com/seu-link"
              value={boleto}
              onChange={e => setBoleto(e.target.value)}
              style={{ ...INPUT, paddingRight: boleto ? 38 : 12 }}
              onFocus={e => (e.target.style.borderColor = "rgba(245,166,35,0.4)")}
              onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            {boleto && (
              <a href={boleto} target="_blank" rel="noopener noreferrer" style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "#5A7A70", display: "flex", alignItems: "center",
              }}>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#3A5A50", margin: "5px 0 0" }}>
            Ex.: link de boleto do Asaas, Iugu, Pagar.me, etc.
          </p>
        </div>

      </div>

      {/* Save */}
      <button
        onClick={() => save()}
        disabled={isPending}
        style={{
          marginTop: 28, display: "inline-flex", alignItems: "center", gap: 7,
          background: isPending ? "rgba(0,200,150,0.5)" : "#00C896",
          color: "#051A12", border: "none", borderRadius: 8,
          padding: "10px 20px", fontSize: 13, fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          fontFamily: "'Syne', sans-serif", transition: "background 0.2s",
        }}
      >
        <Save size={14} />
        {isPending ? "Salvando..." : "Salvar links"}
      </button>
    </div>
  );
}
