import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import QRCode from "react-qr-code";
import { useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, Copy, Smartphone,
  CreditCard, ArrowRight, X, ExternalLink,
} from "lucide-react";
import Logo from "@/assets/logo.png";

// ─── PIX PAYLOAD (BR Code) ───────────────────────────────────────────────────

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

  const safeName = name.normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 25).toUpperCase();
  const safeCity = city.normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 15).toUpperCase();

  const payload =
    tlv("00", "01") +
    mai +
    tlv("52", "0000") +
    tlv("53", "986") +
    amt +
    tlv("58", "BR") +
    tlv("59", safeName) +
    tlv("60", safeCity) +
    tlv("62", tlv("05", "***"));

  const withoutCrc = payload + "6304";
  return withoutCrc + crc16(withoutCrc);
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface PixKeyData {
  key_value: string;
  key_type: string;
  label?: string;
}

interface InvoiceData {
  client: {
    id: string; name: string; due_at: string | null;
    amount: number | null;
    base_amount: number | null;
    late_fees: { fee: number; interest: number; daysLate: number } | null;
    product: string | null;
    empresa: string;
    pix_keys: PixKeyData[];
    payment_link_card: string | null;
    dynamic_charge?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
      transaction_id: string;
    } | null;
  };
  isPaid: boolean;
  lastPayment: { paid_at: string; method: string | null } | null;
}

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", card: "Cartão", cash: "Dinheiro",
  transfer: "Transferência", other: "Outro",
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
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<InvoiceData>({
    queryKey: ["paymentPage", token],
    queryFn: async () => fetchUseQuery<undefined, InvoiceData>({
      route: `/pay/${token}`,
      method: "GET",
    }),
    retry: 0,
    enabled: !!token,
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
        <div style={{ width: 36, height: 36, border: "3px solid rgba(0,200,150,0.1)", borderTopColor: "#00C896", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#64748B", fontSize: 14 }}>Carregando cobrança...</p>
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

  const pixKeys = client.pix_keys || [];
  const isOverdue = client.due_at && new Date(client.due_at) < new Date();
  const daysUntil = client.due_at
    ? Math.ceil((new Date(client.due_at).getTime() - Date.now()) / 86400000)
    : null;

  // ── already paid (confirmed by the service provider) ─────────────────────

  if (isPaid) return (
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
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: "0 0 8px", fontFamily: "'Montserrat', sans-serif" }}>
          Pagamento confirmado!
        </h2>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px" }}>
          Obrigado, {client.name}. Seu pagamento foi registrado.
        </p>

        {lastPayment && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: "10px 16px" }}>
            <CheckCircle2 size={14} color="#00C896" />
            <span style={{ fontSize: 13, color: "#0F172A" }}>
              Pago em {formatDate(lastPayment.paid_at)}
              {lastPayment.method && ` · ${METHOD_LABELS[lastPayment.method] ?? lastPayment.method}`}
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
        .pay-copy-btn:hover { border-color: rgba(0,200,150,0.4) !important; color: #00C896 !important; }
        .platform-cta:hover { background: rgba(0,200,150,0.08) !important; border-color: rgba(0,200,150,0.3) !important; }
        .pay-link-card:hover { opacity: 0.85; }
      `}</style>

      {/* Platform CTA */}
      <a
        href={typeof window !== "undefined" ? window.location.origin : "/"}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(0,200,150,0.05)", border: "1px solid rgba(0,200,150,0.15)",
          borderRadius: 12, padding: "10px 16px", marginBottom: 32,
          textDecoration: "none", transition: "all 0.2s ease", animation: "fadeIn 0.4s ease",
        }}
        className="platform-cta"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={Logo} alt="Cobr" style={{ height: 18, filter: "brightness(1.2)" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#00C896", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Crie suas próprias cobranças
            </span>
            <span style={{ fontSize: 10, color: "#64748B" }}>Automatize seus recebimentos com a Cobr</span>
          </div>
        </div>
        <ExternalLink size={14} color="#00C896" />
      </a>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeIn 0.5s ease" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 16px", overflow: "hidden",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
        }}>
          <img src={Logo} alt="Cobr Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>
          Cobrança
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>
          {client.empresa}
        </div>
      </div>

      {/* Invoice card */}
      <div style={{
        background: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 16, padding: "20px 22px", marginBottom: 20, animation: "fadeIn 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Cliente</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>{client.name}</div>
          </div>
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
              <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 3 }}>
                {client.late_fees ? "Total com encargos" : "Valor"}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: client.late_fees ? "#E84545" : "#00C896", fontFamily: "'Montserrat', sans-serif" }}>
                {formatCurrency(client.amount)}
              </div>
              {client.late_fees && client.base_amount != null && (
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 3 }}>
                  Original: {formatCurrency(client.base_amount)}
                </div>
              )}
            </div>
          )}
          {client.due_at && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, marginBottom: 3 }}>Vencimento</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isOverdue ? "#E84545" : "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>{formatDate(client.due_at)}</div>
            </div>
          )}
        </div>

        {/* Late fees breakdown */}
        {client.late_fees && (
          <div style={{ marginTop: 10, background: "rgba(232,69,69,0.05)", border: "1px solid rgba(232,69,69,0.15)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#E84545", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Encargos por atraso ({client.late_fees.daysLate} dia{client.late_fees.daysLate > 1 ? "s" : ""})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {client.late_fees.fee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#0F172A" }}>
                  <span style={{ color: "#64748B" }}>Multa</span>
                  <span>+ {formatCurrency(client.late_fees.fee)}</span>
                </div>
              )}
              {client.late_fees.interest > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#0F172A" }}>
                  <span style={{ color: "#64748B" }}>Juros</span>
                  <span>+ {formatCurrency(client.late_fees.interest)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {client.product && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748B" }}>
            Referente a: <strong style={{ color: "#0F172A" }}>{client.product}</strong>
          </div>
        )}
      </div>

      {/* PIX section */}
      {client.dynamic_charge?.qr_code ? (
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 16, padding: "20px 22px", marginBottom: 20, animation: "fadeIn 0.35s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Smartphone size={15} color="#00C896" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>
              Pagar com PIX Automático
            </span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, border: "1px solid #E2E8F0" }}>
              {client.dynamic_charge.qr_code_base64 ? (
                <img src={`data:image/png;base64,${client.dynamic_charge.qr_code_base64}`} alt="QR Code PIX" style={{ width: 180, height: 180 }} />
              ) : (
                <QRCode value={client.dynamic_charge.qr_code} size={180} level="M" />
              )}
            </div>
            <div style={{ textAlign: "center", marginBottom: 12, fontSize: 12, color: "#64748B" }}>
              Use a opção "PIX Copia e Cola" no seu banco.
            </div>
            <button
              className="pay-copy-btn"
              onClick={() => copyPix(client.dynamic_charge!.qr_code!)}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                background: "#F8FAFC", border: "1px solid #E2E8F0",
                color: copied ? "#00C896" : "#64748B",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              {copied ? "Copiado!" : "Copiar código PIX"}
            </button>
          </div>
        </div>
      ) : pixKeys.length > 0 && (
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 16, padding: "20px 22px", marginBottom: 20, animation: "fadeIn 0.35s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Smartphone size={15} color="#00C896" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>
              Pagar com PIX
            </span>
          </div>

          {pixKeys.map((key, idx) => {
            const payload = buildPixPayload(key.key_value, client.empresa, "Brasil", client.amount);
            return (
              <div key={idx} style={{ marginBottom: idx === pixKeys.length - 1 ? 0 : 24 }}>
                {pixKeys.length > 1 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>
                    Chave: {key.label || key.key_type}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ background: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, border: "1px solid #E2E8F0" }}>
                    <QRCode value={payload} size={pixKeys.length > 1 ? 140 : 180} level="M" />
                  </div>
                  <div style={{ textAlign: "center", marginBottom: 12, fontSize: 12, color: "#64748B" }}>
                    Chave {key.key_type}: <span style={{ color: "#0F172A", fontWeight: 600 }}>{key.key_value}</span>
                  </div>
                  <button
                    className="pay-copy-btn"
                    onClick={() => copyPix(payload)}
                    style={{
                      width: "100%", padding: "10px 0", borderRadius: 10,
                      background: "#F8FAFC", border: "1px solid #E2E8F0",
                      color: copied ? "#00C896" : "#64748B",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    }}
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* External payment link */}
      {(client.dynamic_charge?.ticket_url || client.payment_link_card) && (
        <div style={{
          background: "#FFFFFF", border: "1px solid #E2E8F0",
          borderRadius: 16, padding: "20px 22px", marginBottom: 20, animation: "fadeIn 0.38s ease",
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", fontFamily: "'Montserrat', sans-serif", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <CreditCard size={15} color="#818CF8" /> Outros Meios de Pagamento
          </div>
          <a
            href={client.dynamic_charge?.ticket_url || client.payment_link_card!}
            target="_blank"
            rel="noopener noreferrer"
            className="pay-link-card"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderRadius: 14, textDecoration: "none",
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(129,140,248,0.08) 100%)",
              border: "1px solid rgba(99,102,241,0.3)",
              transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "rgba(99,102,241,0.2)", padding: 8, borderRadius: 10 }}>
                <CreditCard size={20} color="#818CF8" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#818CF8", fontFamily: "'Montserrat', sans-serif" }}>
                  {client.dynamic_charge?.ticket_url ? "Ir para Pagamento Completo" : "Link de Pagamento"}
                </span>
                <span style={{ fontSize: 11, color: "rgba(129,140,248,0.7)" }}>Clique para acessar opções de Cartão/Boleto</span>
              </div>
            </div>
            <ArrowRight size={18} color="#818CF8" />
          </a>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: "center", marginTop: 40, padding: "20px 0",
        borderTop: "1px solid #F1F5F9",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>Processamento seguro por</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#00C896", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#050807" }} />
            </div>
            <span style={{ color: "#00C896", fontWeight: 800, fontSize: 13, letterSpacing: -0.5, fontFamily: "'Montserrat', sans-serif" }}>Cobr</span>
          </div>
        </div>
        <p style={{ fontSize: 10, color: "#94A3B8", maxWidth: 280, lineHeight: 1.5 }}>
          Esta é uma página oficial de cobrança. Verifique sempre os dados antes de pagar.
        </p>
      </div>
    </PageShell>
  );
}

// ─── SHELL & HELPERS ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#F8FAFC",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "32px 16px 40px",
      fontFamily: " 'Montserrat', sans-serif",
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
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", margin: "0 0 8px", fontFamily: "'Montserrat', sans-serif" }}>{title}</h2>
      <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}
