import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "./TourProvider";
import { useLocation } from "react-router-dom";
import { ArrowRight, MessageCircle, Package, CreditCard, Users, Clock, X } from "lucide-react";

const STEPS = [
  {
    icon: MessageCircle,
    title: "Conectar WhatsApp",
    desc: "Escaneie o QR Code e pronto",
  },
  {
    icon: Package,
    title: "Cadastrar produtos",
    desc: "Nome e valor dos seus serviços",
  },
  {
    icon: CreditCard,
    title: "Adicionar chave PIX",
    desc: "Para receber nos envios automáticos",
  },
  {
    icon: Users,
    title: "Cadastrar primeiro cliente",
    desc: "E ativar a régua de cobrança",
  },
];

export function OnboardingWelcome() {
  const { isTourActive, totalCompleted, startTour } = useTour();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/plans") return;
    const dismissed = sessionStorage.getItem("cobr_welcome_dismissed");
    if (totalCompleted === 0 && !isTourActive && !dismissed) {
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [totalCompleted, isTourActive, pathname]);

  const handleClose = () => {
    sessionStorage.setItem("cobr_welcome_dismissed", "true");
    setOpen(false);
  };

  const handleStart = () => {
    setOpen(false);
    startTour();
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes cobr-onb-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .cobr-onb-dot { animation: cobr-onb-pulse 2s ease-in-out infinite; }
        .cobr-onb-start { transition: background 0.2s, transform 0.15s; }
        .cobr-onb-start:hover { background: #00A87E !important; transform: translateY(-1px); }
        .cobr-onb-skip:hover  { color: #7A9087 !important; }
        .cobr-onb-close:hover { background: rgba(255,255,255,0.08) !important; color: #C0D5CC !important; }
        .cobr-onb-step { transition: background 0.15s; }
        .cobr-onb-step:hover { background: rgba(0,200,150,0.04) !important; }
      `}</style>

      <AnimatePresence>
        {/* Backdrop */}
        <motion.div
          key="cobr-onb-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            padding: "1rem",
          }}
          onClick={handleClose}
        >
          {/* Modal */}
          <motion.div
            key="cobr-onb-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0D1210",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 22,
              maxWidth: 460,
              width: "100%",
              overflow: "hidden",
              fontFamily: "'DM Sans', sans-serif",
              color: "#F0F5F2",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* ── TOP BAR ── */}
            <div style={{
              padding: "1.25rem 1.4rem 0",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  className="cobr-onb-dot"
                  style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#00C896", display: "inline-block",
                  }}
                />
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#00C896",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: 1.2, textTransform: "uppercase",
                }}>
                  Configuração inicial
                </span>
              </div>
              <button
                className="cobr-onb-close"
                onClick={handleClose}
                aria-label="Fechar"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "50%", width: 28, height: 28,
                  cursor: "pointer", color: "#5A7A70",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                <X size={12} />
              </button>
            </div>

            {/* ── BODY ── */}
            <div style={{ padding: "1.25rem 1.4rem 1.4rem" }}>

              {/* Title */}
              <div style={{ marginBottom: "1.35rem" }}>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.6rem", fontWeight: 800,
                  color: "#F0F5F2", letterSpacing: -0.8,
                  lineHeight: 1.15, margin: "0 0 0.5rem",
                }}>
                  Bem-vindo ao<br />
                  <span style={{ color: "#00C896" }}>Cobr.</span>
                </h2>
                <p style={{
                  fontSize: "0.83rem", color: "#5A7A70",
                  lineHeight: 1.65, margin: 0, fontWeight: 400,
                }}>
                  Vamos configurar sua conta em menos de 5 minutos para você já enviar sua primeira cobrança automática.
                </p>
              </div>

              {/* Steps */}
              <div style={{
                background: "#111614",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12, overflow: "hidden",
                marginBottom: "1rem",
              }}>
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className="cobr-onb-step"
                    style={{
                      display: "flex", alignItems: "center", gap: 11,
                      padding: "0.8rem 1rem",
                      borderBottom: i < STEPS.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: "rgba(0,200,150,0.1)",
                      border: "1px solid rgba(0,200,150,0.18)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <step.icon size={14} color="#00C896" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: "0.81rem", fontWeight: 600,
                        color: "#C0D5CC", fontFamily: "'Syne', sans-serif",
                      }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: "0.71rem", color: "#4A6A60", marginTop: 1 }}>
                        {step.desc}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: "#3A5050",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 100, padding: "2px 8px",
                      fontFamily: "'Syne', sans-serif",
                    }}>
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time estimate */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: "1.35rem",
                padding: "0.6rem 0.85rem",
                background: "rgba(0,200,150,0.05)",
                border: "1px solid rgba(0,200,150,0.12)",
                borderRadius: 8,
              }}>
                <Clock size={12} color="#00C896" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#4A8A70", fontWeight: 500 }}>
                  Tempo estimado: menos de 5 minutos
                </span>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  className="cobr-onb-start"
                  onClick={handleStart}
                  style={{
                    width: "100%", padding: "0.8rem",
                    background: "#00C896", color: "#051A12",
                    border: "none", borderRadius: 10,
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "0.88rem", fontWeight: 800,
                    cursor: "pointer",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8,
                  }}
                >
                  Iniciar configuração
                  <ArrowRight size={15} />
                </button>

                <button
                  className="cobr-onb-skip"
                  onClick={handleClose}
                  style={{
                    width: "100%", padding: "0.65rem",
                    background: "none", border: "none",
                    color: "#3A5A50", fontSize: "0.79rem",
                    fontWeight: 500, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "color 0.15s",
                  }}
                >
                  Prefiro explorar por conta própria
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}