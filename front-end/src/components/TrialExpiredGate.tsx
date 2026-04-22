import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Users, MessageCircle, CreditCard } from "lucide-react";

const PERKS = [
  { icon: MessageCircle, label: "Cobranças automáticas via WhatsApp" },
  { icon: Users,         label: "Clientes ilimitados no plano Pro" },
  { icon: CreditCard,   label: "Link de pagamento Pix integrado" },
  { icon: Zap,          label: "Régua de cobrança inteligente" },
];

export function TrialExpiredGate() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes teg-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes teg-pulse  { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .teg-root   { animation: teg-fadein 0.4s ease; }
        .teg-dot    { animation: teg-pulse 2s ease-in-out infinite; }
        .teg-cta:hover    { background: #00A87E !important; transform: translateY(-2px) !important; }
        .teg-cta    { transition: background 0.2s, transform 0.15s; }
        .teg-ghost:hover  { border-color: rgba(0,200,150,0.25) !important; color: #C0D5CC !important; }
        .teg-ghost  { transition: border-color 0.15s, color 0.15s; }
        .teg-perk   { transition: background 0.15s; }
        .teg-perk:hover   { background: rgba(0,200,150,0.05) !important; }
      `}</style>

      <div
        className="teg-root"
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1.5rem",
          background: "rgba(5,8,6,0.82)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{
          width: "100%", maxWidth: 460,
          background: "#0D1210",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
          color: "#F0F5F2",
          boxShadow: "0 48px 96px rgba(0,0,0,0.65)",
        }}>

          {/* ── TOP ACCENT LINE ── */}
          <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #00C896, transparent)" }} />

          {/* ── BODY ── */}
          <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>

            {/* Status badge */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "rgba(232,69,69,0.1)", border: "1px solid rgba(232,69,69,0.2)",
                borderRadius: 100, padding: "4px 14px",
              }}>
                <span
                  className="teg-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#E84545", display: "inline-block" }}
                />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#E84545", letterSpacing: 1.1, textTransform: "uppercase", fontFamily: "'Syne', sans-serif" }}>
                  Período de teste encerrado
                </span>
              </div>
            </div>

            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.65rem", fontWeight: 800,
                color: "#F0F5F2", letterSpacing: -0.8,
                lineHeight: 1.15, margin: "0 0 0.6rem",
              }}>
                Seu trial chegou ao fim.
                <br />
                <span style={{ color: "#00C896" }}>Continue cobrando.</span>
              </h2>
              <p style={{ fontSize: "0.83rem", color: "#5A7A70", lineHeight: 1.65, margin: 0 }}>
                Não perca clientes nem receita. Assine um plano e mantenha suas cobranças automáticas rodando agora.
              </p>
            </div>

            {/* Perks list */}
            <div style={{
              background: "#111614",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 12, overflow: "hidden",
              marginBottom: "1.25rem",
            }}>
              {PERKS.map((p, i) => (
                <div
                  key={i}
                  className="teg-perk"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "0.72rem 1rem",
                    borderBottom: i < PERKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <p.icon size={13} color="#00C896" />
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "#C0D5CC", fontWeight: 500 }}>
                    {p.label}
                  </span>
                  <div style={{ marginLeft: "auto", width: 16, height: 16, borderRadius: "50%", background: "rgba(0,200,150,0.12)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" stroke="#00C896" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof strip */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0.6rem 0.85rem",
              background: "rgba(0,200,150,0.05)",
              border: "1px solid rgba(0,200,150,0.12)",
              borderRadius: 8, marginBottom: "1.25rem",
            }}>
              <div style={{ display: "flex", gap: -4 }}>
                {["#6366f1","#00C896","#F5A623"].map((c, i) => (
                  <div key={i} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: "2px solid #0D1210", marginLeft: i > 0 ? -6 : 0, flexShrink: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: "#4A8A70", fontWeight: 500 }}>
                Centenas de empresas já automatizaram suas cobranças
              </span>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                className="teg-cta"
                onClick={() => navigate("/plans")}
                style={{
                  width: "100%", padding: "0.85rem",
                  background: "#00C896", color: "#051A12",
                  border: "none", borderRadius: 10,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "0.92rem", fontWeight: 800,
                  cursor: "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                }}
              >
                Ver planos disponíveis
                <ArrowRight size={16} />
              </button>

              <button
                className="teg-ghost"
                onClick={() => navigate("/plans")}
                style={{
                  width: "100%", padding: "0.72rem",
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "#4A6A60", borderRadius: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.8rem", fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                A partir de R$ 97/mês · Cancele quando quiser
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}