import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import QRCode from "react-qr-code";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2, Clock, AlertCircle, Copy, Smartphone,
  CreditCard, Banknote, ArrowRight, X,
} from "lucide-react";

// ─── PIX PAYLOAD (BR Code) ───────────────────────────────────────────────────
// Generates a Pix Copia e Cola string from a key + amount
// Spec: BCB manual de padrões para iniciação do Pix - BR Code

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xffff).toString(16).toUpperCase().padStart(4, "0"));
}

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function buildPixPayload(key: string, name: string, city: string, amount?: number | null): string {
  const merchantAccountInfo = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", key);
  const mai = tlv("26", merchantAccountInfo);

  const amt = amount && amount > 0
    ? tlv("54", amount.toFixed(2))
    : "";

  const safeName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 25).toUpperCase();
  const safeCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 15).toUpperCase();

  const payload =
    tlv("00", "01") +           // payload format indicator
    mai +                        // merchant account info
    tlv("52", "0000") +         // merchant category code
    tlv("53", "986") +          // currency (BRL)
    amt +                        // transaction amount (optional)
    tlv("58", "BR") +           // country code
    tlv("59", safeName) +       // merchant name
    tlv("60", safeCity) +       // merchant city
    tlv("62", tlv("05", "***")); // additional data

  const withoutCrc = payload + "6304";
  return withoutCrc + crc16(withoutCrc);
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface InvoiceData {
  client: {
    id: string; name: string; due_at: string | null;
    amount: number | null; product: string | null;
    empresa: string; pix_key: string | null; pix_type: string | null;
    payment_link_card: string | null; payment_link_boleto: string | null;
  };
  isPaid: boolean;
  lastPayment: { paid_at: string; method: string | null } | null;
}

const METHOD_ICONS: Record<string, { label: string; color: string }> = {
  pix:      { label: "PIX",          color: "#00C896" },
  card:     { label: "Cartão",       color: "#6366f1" },
  cash:     { label: "Dinheiro",     color: "#F5A623" },
  transfer: { label: "Transferência",color: "#14b8a6" },
  other:    { label: "Outro",        color: "#8b5cf6" },
};

function formatCurrency(v?: number | null) {
  if (v == null) return null;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR");
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [copied, setCopied]     = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("pix");
  const [declarou, setDeclarou] = useState(false);

  const { data, isLoading, error } = useQuery<InvoiceData>({
    queryKey: ["paymentPage", token],
    queryFn: async () => {
      const res = await fetchUseQuery<undefined, InvoiceData>({
        route: `/pay/${token}`,
        method: "GET",
      });
      return res;
    },
    retry: 0,
    enabled: !!token,
  });

  const { mutate: confirm, isPending: isConfirming } = useMutation({
    mutationFn: async () => {
      await fetchUseQuery<any, any>({
        route: `/pay/${token}/confirm`,
        method: "POST",
        data: { payment_method: selectedMethod },
      });
    },
    onSuccess: () => {
      setConfirmed(true);
      toast.success("Pagamento confirmado!");
    },
    onError: () => {
      toast.error("Erro ao confirmar. Tente novamente.");
    },
  });

  function copyPix(pixCode: string) {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── loading ──────────────────────────────────────────────────────────────

  if (isLoading) return (
    <PageShell>
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(0,200,150,0.2)", borderTopColor: "#00C896", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#5A7A70", fontSize: 14 }}>Carregando cobrança...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PageShell>
  );

  // ── error states ─────────────────────────────────────────────────────────

  if ((error as any)?.status === 410) return (
    <PageShell>
      <ErrorCard icon={<Clock size={32} color="#F5A623" />} title="Link expirado" desc="Este link de pagamento não é mais válido. Solicite um novo link ao responsável." />
    </PageShell>
  );

  if (error || !data) return (
    <PageShell>
      <ErrorCard icon={<X size={32} color="#E84545" />} title="Link inválido" desc="Este link de pagamento não foi encontrado ou é inválido." />
    </PageShell>
  );

  const { client, isPaid, lastPayment } = data;

  const pixPayload = client.pix_key
    ? buildPixPayload(client.pix_key, client.empresa, "Brasil", client.amount)
    : null;

  const isOverdue = client.due_at && new Date(client.due_at) < new Date();
  const daysUntil = client.due_at
    ? Math.ceil((new Date(client.due_at).getTime() - Date.now()) / 86400000)
    : null;

  // ── already paid ─────────────────────────────────────────────────────────

  if (isPaid || confirmed) return (
    <PageShell>
      <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(0,200,150,0.12)", border: "2px solid rgba(0,200,150,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <CheckCircle2 size={34} color="#00C896" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F5F2", margin: "0 0 8px", fontFamily: "'Syne', sans-serif" }}>
          Pagamento confirmado!
        </h2>
        <p style={{ fontSize: 14, color: "#5A7A70", margin: "0 0 20px" }}>
          Obrigado, {client.name}. O responsável foi notificado.
        </p>
        {lastPayment && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: "10px 16px" }}>
            <CheckCircle2 size={14} color="#00C896" />
            <span style={{ fontSize: 13, color: "#C0D5CC" }}>
              Pago em {formatDate(lastPayment.paid_at)}
              {lastPayment.method && ` · ${METHOD_ICONS[lastPayment.method]?.label ?? lastPayment.method}`}
            </span>
          </div>
        )}
      </div>
    </PageShell>
  );

  // ── main invoice page ─────────────────────────────────────────────────────

  return (
    <PageShell>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pay-method-btn { transition: all 0.15s; }
        .pay-method-btn:hover { opacity: 0.85; }
        .pay-confirm-btn { transition: background 0.2s; }
        .pay-confirm-btn:hover:not(:disabled) { background: #00A87E !important; }
        .pay-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pay-copy-btn:hover { border-color: rgba(0,200,150,0.4) !important; color: #00C896 !important; }
      `}</style>

      {/* Header — empresa name */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#3A5A50", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>
          Cobrança enviada por
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#F0F5F2", fontFamily: "'Syne', sans-serif" }}>
          {client.empresa}
        </div>
      </div>

      {/* Invoice card */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "20px 22px", marginBottom: 20,
        animation: "fadeIn 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#3A5A50", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Cliente</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F5F2", fontFamily: "'Syne', sans-serif" }}>{client.name}</div>
          </div>
          {/* Status badge */}
          {isOverdue ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(232,69,69,0.1)", color: "#E84545", border: "1px solid rgba(232,69,69,0.2)", borderRadius: 100, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
              <AlertCircle size={11} /> Em atraso
            </span>
          ) : daysUntil !== null && daysUntil <= 3 ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(245,166,35,0.1)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 100, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
              <Clock size={11} /> Vence em {daysUntil}d
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,200,150,0.08)", color: "#00C896", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 100, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
              <Clock size={11} /> Em dia
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {client.amount != null && (
            <div style={{ background: "rgba(0,200,150,0.05)", border: "1px solid rgba(0,200,150,0.12)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#3A5A50", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 3 }}>Valor</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#00C896", fontFamily: "'Syne', sans-serif" }}>{formatCurrency(client.amount)}</div>
            </div>
          )}
          {client.due_at && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#3A5A50", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 3 }}>Vencimento</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isOverdue ? "#E84545" : "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>{formatDate(client.due_at)}</div>
            </div>
          )}
        </div>

        {client.product && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#5A7A70" }}>
            Referente a: <strong style={{ color: "#C0D5CC" }}>{client.product}</strong>
          </div>
        )}
      </div>

      {/* PIX section */}
      {pixPayload && (
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "20px 22px", marginBottom: 20,
          animation: "fadeIn 0.35s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Smartphone size={15} color="#00C896" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>
              Pagar com PIX
            </span>
          </div>

          {/* QR Code */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{
              background: "#fff", borderRadius: 12, padding: 14,
              display: "inline-block", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
            }}>
              <QRCode value={pixPayload} size={180} level="M" />
            </div>
          </div>

          {/* Pix type label */}
          {client.pix_type && (
            <div style={{ textAlign: "center", marginBottom: 12, fontSize: 12, color: "#5A7A70" }}>
              Chave {client.pix_type}:{" "}
              <span style={{ color: "#C0D5CC", fontWeight: 600 }}>{client.pix_key}</span>
            </div>
          )}

          {/* Copy button */}
          <button
            className="pay-copy-btn"
            onClick={() => copyPix(pixPayload)}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10,
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              color: copied ? "#00C896" : "#7A9087",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
        </div>
      )}

      {/* Card / Boleto links */}
      {(client.payment_link_card || client.payment_link_boleto) && (
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "20px 22px", marginBottom: 20,
          animation: "fadeIn 0.38s ease",
        }}>
          <div style={{ fontSize: 11, color: "#3A5A50", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Outros métodos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {client.payment_link_card && (
              <a
                href={client.payment_link_card}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 16px", borderRadius: 10, textDecoration: "none",
                  background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.08)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CreditCard size={16} color="#818CF8" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#818CF8", fontFamily: "'Syne', sans-serif" }}>
                    Pagar com Cartão
                  </span>
                </div>
                <ArrowRight size={14} color="#818CF8" />
              </a>
            )}
            {client.payment_link_boleto && (
              <a
                href={client.payment_link_boleto}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 16px", borderRadius: 10, textDecoration: "none",
                  background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,166,35,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,166,35,0.08)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Banknote size={16} color="#F5A623" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F5A623", fontFamily: "'Syne', sans-serif" }}>
                    Pagar com Boleto
                  </span>
                </div>
                <ArrowRight size={14} color="#F5A623" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* "Já paguei" section */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "20px 22px",
        animation: "fadeIn 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={15} color="#00C896" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>
            Já realizei o pagamento
          </span>
        </div>

        <p style={{ fontSize: 12, color: "#5A7A70", margin: "0 0 14px", lineHeight: 1.6 }}>
          Se já pagou por outro meio (dinheiro, cartão, transferência), selecione abaixo e confirme.
        </p>

        {/* Method selector */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {([
            { value: "pix",      label: "PIX",           icon: <Smartphone size={11} /> },
            { value: "card",     label: "Cartão",        icon: <CreditCard size={11} /> },
            { value: "cash",     label: "Dinheiro",      icon: <Banknote size={11} /> },
            { value: "transfer", label: "Transferência", icon: <ArrowRight size={11} /> },
          ]).map(({ value, label, icon }) => {
            const active = selectedMethod === value;
            const col = METHOD_ICONS[value]?.color ?? "#00C896";
            return (
              <button
                key={value}
                className="pay-method-btn"
                onClick={() => setSelectedMethod(value)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  border: `1px solid ${active ? col + "55" : "rgba(255,255,255,0.08)"}`,
                  background: active ? col + "18" : "transparent",
                  color: active ? col : "#3A5A50",
                }}
              >
                {icon} {label}
              </button>
            );
          })}
        </div>

        {/* Checkbox de responsabilidade */}
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 18, cursor: "pointer", background: "rgba(0,0,0,0.2)", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
          <input 
            type="checkbox" 
            checked={declarou} 
            onChange={(e) => setDeclarou(e.target.checked)} 
            style={{ marginTop: 2, accentColor: "#00C896", width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} 
          />
          <span style={{ fontSize: 12, color: "#9AA5A0", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
            Confirmo que já realizei o pagamento/transferência e entendo que o envio de <strong>confirmações falsas</strong> resultará no bloqueio e cancelamento dos serviços vinculados a esta conta.
          </span>
        </label>

        <button
          className="pay-confirm-btn"
          onClick={() => confirm()}
          disabled={isConfirming || !declarou}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: "#00C896", color: "#051A12",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {isConfirming
            ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#051A12", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Confirmando...</>
            : <><CheckCircle2 size={15} /> Confirmar pagamento</>
          }
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 28, paddingBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#2A4A40" }}>
          Cobranças gerenciadas por{" "}
          <span style={{ color: "#3A6A5A", fontWeight: 600 }}>Cobr</span>
        </span>
      </div>
    </PageShell>
  );
}

// ─── SHELL & HELPERS ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#080E0C",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px 40px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {children}
      </div>
    </div>
  );
}

function ErrorCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0F5F2", margin: "0 0 8px", fontFamily: "'Syne', sans-serif" }}>{title}</h2>
      <p style={{ fontSize: 13, color: "#5A7A70", margin: 0, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}
