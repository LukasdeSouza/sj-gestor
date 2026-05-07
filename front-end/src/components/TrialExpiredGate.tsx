import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Users, MessageCircle, CreditCard } from "lucide-react";

const PERKS = [
  { icon: MessageCircle, label: "Cobranças automáticas via WhatsApp" },
  { icon: Users, label: "Clientes ilimitados no plano Pro" },
  { icon: CreditCard, label: "Link de pagamento Pix integrado" },
  { icon: Zap, label: "Régua de cobrança inteligente" },
];

export function TrialExpiredGate() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        @keyframes teg-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes teg-pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .teg-root   { animation: teg-fadein 0.4s ease; }
        .teg-dot    { animation: teg-pulse 2s ease-in-out infinite; }
        .teg-cta:hover    { background: #00A87E !important; transform: translateY(-2px) !important; }
        .teg-cta    { transition: background 0.2s, transform 0.15s; }
        .teg-ghost:hover  { background: #F1F5F9 !important; border-color: #CBD5E1 !important; color: #0F172A !important; }
        .teg-ghost  { transition: all 0.15s; }
        .teg-perk   { transition: background 0.15s; }
        .teg-perk:hover   { background: #F1F5F9 !important; }
      `}</style>

      <div
        className="teg-root"
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1.5rem",
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{
          width: "100%", maxWidth: 460,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 22,
          overflow: "hidden",
          fontFamily: " 'Montserrat', sans-serif",
          color: "#0F172A",
          boxShadow: "0 48px 96px rgba(0,0,0,0.12)",
        }}>

          {/* ── TOP ACCENT LINE ── */}
          <div style={{ height: 3, background: "linear-gradient(90deg, #E84545, #00C896, #E84545)" }} />

          {/* ── BODY ── */}
          <div style={{ padding: "2rem 2rem 1.75rem" }}>

            {/* Status badge */}
            {/* <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(232,69,69,0.06)", border: "1px solid rgba(232,69,69,0.15)",
                borderRadius: 100, padding: "4px 14px",
              }}>
                <span
                  className="teg-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#E84545", display: "inline-block" }}
                />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#E84545", letterSpacing: 1.1, textTransform: "uppercase" }}>
                  Período de teste encerrado
                </span>
              </div>
            </div> */}

            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
              <h2 style={{
                fontSize: "1.65rem", fontWeight: 800,
                color: "#0F172A", letterSpacing: -0.8,
                lineHeight: 1.15, margin: "0 0 0.6rem",
              }}>
                Seu trial chegou ao fim.
                <br />
                <span style={{ color: "#00C896" }}>Continue cobrando.</span>
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.6, margin: 0 }}>
                Não perca clientes nem receita. Assine um plano e mantenha suas cobranças automáticas rodando agora.
              </p>
            </div>

            {/* Perks list */}
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: 12, overflow: "hidden",
              marginBottom: "1.5rem",
            }}>
              {PERKS.map((p, i) => (
                <div
                  key={i}
                  className="teg-perk"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.85rem 1rem",
                    borderBottom: i < PERKS.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <p.icon size={13} color="#00C896" />
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: 600 }}>
                    {p.label}
                  </span>
                  <div style={{ marginLeft: "auto", width: 16, height: 16, borderRadius: "50%", background: "rgba(0,200,150,0.12)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="#00C896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof strip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0.75rem 1rem",
              background: "rgba(0,200,150,0.04)",
              border: "1px solid rgba(0,200,150,0.1)",
              borderRadius: 10, marginBottom: "1.5rem",
            }}>
              <div style={{ display: "flex", gap: -6 }}>
                {["#6366f1", "#00C896", "#F5A623"].map((c, i) => (
                  <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid #FFFFFF", marginLeft: i > 0 ? -6 : 0, flexShrink: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: "#00A87E", fontWeight: 600 }}>
                Centenas de empresas já automatizaram suas cobranças com o cobr.
              </span>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="teg-cta"
                onClick={() => navigate("/plans")}
                style={{
                  width: "100%", padding: "0.9rem",
                  background: "#00C896", color: "#FFFFFF",
                  border: "none", borderRadius: 12,
                  fontSize: "0.9rem", fontWeight: 700,
                  cursor: "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  boxShadow: "0 10px 20px -10px rgba(0,200,150,0.5)"
                }}
              >
                Escolher meu plano
                <ArrowRight size={16} />
              </button>

              <button
                className="teg-ghost"
                onClick={() => navigate("/plans")}
                style={{
                  width: "100%", padding: "0.75rem",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  color: "#64748B", borderRadius: 12,
                  fontSize: "0.8rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Planos a partir de R$ 97/mês
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
