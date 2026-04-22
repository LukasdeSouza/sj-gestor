import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageCircle, CreditCard, BarChart3, Zap, ArrowRight,
  CheckCircle2, Star, Smartphone, ChevronDown, TrendingUp,
  Clock, Shield, Users, Bell, Repeat, Send, X, Menu
} from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

/* ─── ANIMATED COUNTER ────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1800;
        const step = to / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= to) { setCount(to); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return <span ref={ref}>{prefix}{count.toLocaleString("pt-BR")}{suffix}</span>;
}

/* ─── WHATSAPP MOCK ────────────────────────────────────────── */
function WhatsAppMock() {
  const messages = [
    { type: "out", text: "Olá Ana! 👋 Seu plano mensal de R$ 150,00 vence em 3 dias.", time: "09:00", delay: 0 },
    { type: "in",  text: "Oi! Já posso pagar agora?", time: "09:02", delay: 800 },
    { type: "out", text: "Claro! Chave PIX: pagamentos@academia.com\nVencimento: 15/01/2025 💚", time: "09:02", delay: 1400 },
    { type: "in",  text: "Pago! 🎉", time: "09:05", delay: 2200 },
    { type: "sys", text: "✅ Pagamento confirmado automaticamente", time: "09:05", delay: 3000 },
  ];

  const [visible, setVisible] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        messages.forEach((m, i) => {
          setTimeout(() => setVisible(v => [...v, i]), m.delay);
        });
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative mx-auto" style={{ maxWidth: 320 }}>
      {/* Phone frame */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderRadius: 32,
        padding: "12px 8px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
      }}>
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 16px 8px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          <span>9:20</span>
          <span>●●●</span>
        </div>
        {/* WhatsApp UI */}
        <div style={{ background: "#0b141a", borderRadius: 20, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "#202c33", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #00C896, #00a07a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>C</div>
            <div>
              <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Cobr</div>
              <div style={{ color: "#8696a0", fontSize: 11 }}>online</div>
            </div>
          </div>
          {/* Chat */}
          <div style={{ padding: "12px 10px", minHeight: 280, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                opacity: visible.includes(i) ? 1 : 0,
                transform: visible.includes(i) ? "translateY(0)" : "translateY(8px)",
                transition: "all 0.4s ease",
                display: "flex",
                justifyContent: msg.type === "out" ? "flex-end" : msg.type === "sys" ? "center" : "flex-start",
              }}>
                {msg.type === "sys" ? (
                  <div style={{ background: "rgba(0,200,150,0.15)", border: "1px solid rgba(0,200,150,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#00C896", textAlign: "center" }}>{msg.text}</div>
                ) : (
                  <div style={{
                    background: msg.type === "out" ? "#005c4b" : "#202c33",
                    borderRadius: msg.type === "out" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                    padding: "8px 10px",
                    maxWidth: "80%",
                    fontSize: 12,
                    fontWeight: 300,
                    color: "#e9edef",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                  }}>
                    {msg.text}
                    <div style={{ fontSize: 10, color: "#8696a0", textAlign: "right", marginTop: 2 }}>{msg.time} {msg.type === "out" && "✓✓"}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Input */}
          <div style={{ background: "#202c33", padding: "8px 10px", display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, background: "#2a3942", borderRadius: 20, padding: "8px 14px", fontSize: 12, color: "#8696a0" }}>Mensagem</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#00C896", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={14} color="#fff" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div style={{
        position: "absolute", top: 40, right: -20,
        background: "#00C896", borderRadius: 12, padding: "8px 12px",
        boxShadow: "0 8px 24px rgba(0,200,150,0.4)",
        animation: "float 3s ease-in-out infinite",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>+R$ 450</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>cobrado agora</div>
      </div>
      <div style={{
        position: "absolute", bottom: 60, left: -24,
        background: "#fff", borderRadius: 12, padding: "8px 12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        animation: "float 3s ease-in-out infinite 1.5s",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a2e" }}>3 pagamentos</div>
        <div style={{ fontSize: 10, color: "#666", fontWeight: 300 }}>últimas 2 horas</div>
      </div>
    </div>
  );
}

/* ─── PRICING CARD ─────────────────────────────────────────── */
function PricingCard({ plan, price, clients, features, highlight, cta, navigate }: any) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg, #00C896 0%, #00a07a 100%)" : "rgba(255,255,255,0.03)",
      border: highlight ? "none" : "1px solid rgba(255,255,255,0.08)",
      borderRadius: 24,
      padding: "32px 28px",
      position: "relative",
      transform: highlight ? "scale(1.05)" : "scale(1)",
      boxShadow: highlight ? "0 24px 60px rgba(0,200,150,0.35)" : "none",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}>
      {highlight && (
        <div style={{
          position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
          background: "#fff", color: "#00a07a", fontSize: 11, fontWeight: 800,
          padding: "4px 16px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase",
        }}>Mais Popular</div>
      )}
      <div style={{ color: highlight ? "rgba(255,255,255,0.85)" : "#8896a0", fontSize: 13, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>{plan}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ color: highlight ? "#fff" : "#e9edef", fontSize: 42, fontWeight: 800 }}>R$ {price}</span>
        <span style={{ color: highlight ? "rgba(255,255,255,0.7)" : "#8896a0", fontSize: 14 }}>/mês</span>
      </div>
      <div style={{ color: highlight ? "rgba(255,255,255,0.7)" : "#8896a0", fontSize: 13, marginBottom: 28 }}>até {clients} clientes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {features.map((f: string, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color={highlight ? "#fff" : "#00C896"} />
            <span style={{ color: highlight ? "rgba(255,255,255,0.9)" : "#c9d1d9", fontSize: 14 }}>{f}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate("/auth")}
        style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: highlight ? "#fff" : "rgba(0,200,150,0.15)",
          color: highlight ? "#00a07a" : "#00C896",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "1"; }}
      >{cta}</button>
    </div>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────── */
const Index = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const plans = [
    {
      plan: "Gratuito",
      price: "0",
      clients: "5",
      features: ["Disparo via WhatsApp", "1 template de mensagem", "Chave PIX integrada", "Ideal para testar"],
      highlight: false,
      cta: "Começar grátis",
    },
    {
      plan: "Pro",
      price: "79",
      clients: "100",
      features: ["Tudo do Gratuito", "Régua de cobrança automática", "Múltiplos templates por nicho", "Dashboard completo", "Suporte prioritário"],
      highlight: true,
      cta: "Quero esse →",
    },
    {
      plan: "Ilimitado",
      price: "149",
      clients: "∞",
      features: ["Tudo do Pro", "Clientes ilimitados", "Relatórios avançados", "Onboarding dedicado"],
      highlight: false,
      cta: "Assinar agora",
    },
  ];

  const faqs = [
    { q: "Preciso trocar meu número do WhatsApp?", a: "Não. Você usa o seu número atual — basta escanear o QR Code e conectar em segundos." },
    { q: "E se meu cliente não pagar mesmo com o lembrete?", a: "O Cobr envia a régua completa: D-3, D0, D+3, D+7. Se não pagar, você recebe um alerta para tomar uma ação manual." },
    { q: "Meus dados são seguros?", a: "Sim. Usamos criptografia de ponta a ponta e backups automáticos. Seus dados nunca são compartilhados." },
    { q: "Funciona para qualquer tipo de negócio?", a: "Sim — academia, clínica, escola, pet shop, condomínio. Se você cobra mensalidade recorrente, o Cobr é pra você." },
    { q: "Posso cancelar quando quiser?", a: "Sim, sem multa e sem burocracia. Você cancela com um clique." },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: "#0a0f1a", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif", color: "#e9edef", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(0,200,150,0.4)} 50%{box-shadow:0 0 0 12px rgba(0,200,150,0)} }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.35s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.5s ease both; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,200,150,0.4) !important; }
        .btn-primary { transition: all 0.2s ease; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(0,200,150,0.3) !important; }
        .feature-card { transition: all 0.25s ease; }
        .nav-link { color: #8896a0; font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #00C896; }
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 999; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 150px; }
      `}</style>

      <div className="grain" />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(10,15,26,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #00C896, #00a07a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 16, color: "#fff",
            }}>C</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: -0.5 }}>Cobr</span>
          </div>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }} className="hidden md:flex">
            {["Funcionalidades", "Preços", "FAQ"].map(link => (
              <a key={link} className="nav-link" onClick={() => document.getElementById(link.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}>{link}</a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => navigate("/auth")} style={{ background: "none", border: "none", color: "#8896a0", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 12px" }}>Entrar</button>
            <button
              onClick={() => navigate("/auth")}
              className="btn-primary"
              style={{
                background: "linear-gradient(135deg, #00C896, #00a07a)",
                border: "none", borderRadius: 10, padding: "10px 20px",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,200,150,0.3)",
              }}
            >Começar grátis</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", padding: "120px 24px 80px" }}>
        {/* BG glow */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,200,150,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "10%", right: "10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(0,200,150,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          {/* Left */}
          <div>
            <div className="fade-up-1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.25)", borderRadius: 20, padding: "6px 14px", marginBottom: 28 }}>
              {/* <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C896", animation: "pulse-green 2s infinite" }} /> */}
              <span style={{ fontSize: 13, color: "#00C896", fontWeight: 600 }}>Automatize. Receba. Cresça.</span>
            </div>

            <h1 className="fade-up-2" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 24, color: "#fff" }}>
              Chega de perseguir<br />
              <span style={{ color: "#00C896" }}>cliente devedor</span><br />
              no WhatsApp.
            </h1>

            <p className="fade-up-3" style={{ fontSize: 18, color: "#8896a0", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              O Cobr dispara cobranças automáticas via WhatsApp, lembra seus clientes antes do vencimento e te avisa quando o dinheiro cai. <strong style={{ color: "#c9d1d9" }}>Você foca no negócio.</strong>
            </p>

            <div className="fade-up-4" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/auth")}
                className="btn-primary"
                style={{
                  background: "linear-gradient(135deg, #00C896, #00a07a)",
                  border: "none", borderRadius: 14, padding: "16px 28px",
                  color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 8px 30px rgba(0,200,150,0.35)",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <Zap size={18} /> Criar conta grátis <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, padding: "16px 28px", color: "#c9d1d9",
                  fontSize: 16, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                Ver como funciona
              </button>
            </div>

            <div className="fade-up-4" style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
              <div style={{ display: "flex" }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${i * 40}, 70%, 50%)`, border: "2px solid #0a0f1a", marginLeft: i > 1 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>{String.fromCharCode(64+i)}</div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}</div>
                <span style={{ fontSize: 13, color: "#8896a0" }}><strong style={{ color: "#c9d1d9" }}>500+</strong> negócios usando agora</span>
              </div>
            </div>
          </div>

          {/* Right — phone */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <WhatsAppMock />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
          {[
            { val: 2500, suffix: "+", label: "negócios ativos" },
            { val: 2, prefix: "R$ ", suffix: "M+", label: "cobrados via Cobr" },
            { val: 98, suffix: "%", label: "taxa de satisfação" },
            { val: 10, suffix: "h/sem", label: "economizadas em média" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#00C896", letterSpacing: -1 }}>
                <Counter to={s.val} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: "#8896a0", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEMO / HOW IT WORKS ── */}
      <section id="demo" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 13, color: "#00C896", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Como funciona</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 16 }}>
              Configure em 5 minutos.<br />Receba para sempre.
            </h2>
            <p style={{ color: "#8896a0", fontSize: 18, maxWidth: 500, margin: "0 auto" }}>Sem treinamento. Sem suporte técnico. Sem enrolação.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { num: "01", icon: Smartphone, title: "Conecte seu WhatsApp", desc: "Escaneie o QR Code com seu celular. Leva 30 segundos. Usa seu número atual — nada muda para seus contatos." },
              { num: "02", icon: Users, title: "Cadastre seus clientes", desc: "Importe uma planilha ou cadastre manualmente. Configure valor, vencimento e a régua de cobrança." },
              { num: "03", icon: Send, title: "Pronto. O Cobr faz o resto", desc: "D-3, D0, D+3, D+7 — as mensagens saem sozinhas. Você só recebe o alerta de pagamento confirmado." },
            ].map((step, i) => (
              <div key={i} className="feature-card" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "32px 28px", position: "relative",
              }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "rgba(0,200,150,0.08)", position: "absolute", top: 16, right: 20, lineHeight: 1 }}>{step.num}</div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <step.icon size={22} color="#00C896" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{step.title}</h3>
                <p style={{ color: "#8896a0", fontSize: 15, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="funcionalidades" style={{ padding: "80px 24px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 13, color: "#00C896", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Funcionalidades</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: -1 }}>Tudo que você precisa para<br /><span style={{ color: "#00C896" }}>não perder dinheiro</span></h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {[
              { icon: Bell, title: "Régua automática de cobrança", desc: "Defina os dias e o Cobr envia: aviso antes, lembrete no dia, follow-up após o vencimento. Automático. Todo mês." },
              { icon: MessageCircle, title: "Templates por nicho", desc: "Academia, clínica, escola, petshop — templates prontos com tom certo pra cada tipo de negócio. Sem improvisar." },
              { icon: CreditCard, title: "PIX integrado por cliente", desc: "Cadastre sua chave PIX e ela aparece automaticamente nas mensagens. O cliente recebe e já pode pagar na hora." },
              { icon: BarChart3, title: "Dashboard de inadimplência", desc: "Veja em tempo real quem pagou, quem está em atraso e quanto você tem a receber. Tudo em um painel limpo." },
              { icon: Repeat, title: "Cobranças recorrentes", desc: "Configure uma vez, recebe todo mês. O Cobr gera e dispara automaticamente para cada cliente no dia certo." },
              { icon: Shield, title: "Dados seguros e backup", desc: "Criptografia, backups automáticos e dados nunca compartilhados. Sua operação protegida, sempre." },
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18, padding: "28px 24px", display: "flex", gap: 20, alignItems: "flex-start",
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <f.icon size={20} color="#00C896" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ color: "#8896a0", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: -1 }}>Quem usa, <span style={{ color: "#00C896" }}>não volta atrás</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { name: "Carla Mendes", role: "Dona de academia, BH", text: "Eu cobrava no braço todo mês, passava vergonha com aluno. Com o Cobr, tudo automático. Recuperei R$ 1.200 no primeiro mês.", avatar: "C" },
              { name: "Dr. Paulo Saraiva", role: "Psicólogo, SP", text: "Não consigo cobrar paciente — é constrangedor. O Cobr manda a mensagem por mim. Profissional, educado e funciona.", avatar: "P" },
              { name: "Renata Souza", role: "Escola de inglês, RJ", text: "Reduzi inadimplência de 22% para 6% em 2 meses. Simples assim. Não imagino trabalhar sem o Cobr.", avatar: "R" },
            ].map((t, i) => (
              <div key={i} className="feature-card" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "28px 24px",
              }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>{[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />)}</div>
                <p style={{ color: "#c9d1d9", fontSize: 15, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #00C896, #00a07a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff" }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#8896a0" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="preços" style={{ padding: "80px 24px", background: "rgba(255,255,255,0.015)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 13, color: "#00C896", fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Preços</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 12 }}>Simples. Sem surpresa.</h2>
            <p style={{ color: "#8896a0", fontSize: 18 }}>7 dias grátis em qualquer plano. Cancele quando quiser.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "center" }}>
            {plans.map((p, i) => <PricingCard key={i} {...p} navigate={navigate} />)}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: -1 }}>Dúvidas frequentes</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)", border: `1px solid ${openFaq === i ? "rgba(0,200,150,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s",
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", background: "none", border: "none", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{faq.q}</span>
                  <ChevronDown size={18} color="#8896a0" style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 20px", color: "#8896a0", fontSize: 15, lineHeight: 1.7 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(0,200,150,0.12), rgba(0,160,122,0.06))",
            border: "1px solid rgba(0,200,150,0.2)",
            borderRadius: 28, padding: "64px 40px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(0,200,150,0.15), transparent)", borderRadius: "50%" }} />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 16 }}>
              Seu dinheiro tá na mesa.<br /><span style={{ color: "#00C896" }}>O Cobr vai buscar pra você.</span>
            </h2>
            <p style={{ color: "#8896a0", fontSize: 18, marginBottom: 36 }}>Crie sua conta grátis agora. Sem cartão de crédito. Sem burocracia.</p>
            <button
              onClick={() => navigate("/auth")}
              className="btn-primary"
              style={{
                background: "linear-gradient(135deg, #00C896, #00a07a)",
                border: "none", borderRadius: 16, padding: "18px 36px",
                color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 12px 40px rgba(0,200,150,0.4)",
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
            >
              <Zap size={20} /> Quero receber sem estresse <ArrowRight size={18} />
            </button>
            <p style={{ fontSize: 13, color: "#8896a0", marginTop: 16 }}>7 dias grátis · Cancela com 1 clique · Suporte incluso</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #00C896, #00a07a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff" }}>C</div>
            <span style={{ fontWeight: 700, color: "#fff" }}>Cobr</span>
          </div>
          <p style={{ fontSize: 13, color: "#8896a0" }}>
            © 2025 Cobr · Desenvolvido por{" "}
            <a href="https://codetechsoftware.com.br/br" target="_blank" style={{ color: "#00C896", textDecoration: "none", fontWeight: 600 }}>Codetech Software</a>
          </p>
          <a href="https://www.instagram.com/codetechsoftware" target="_blank" style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8896a0",
            textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
            padding: "6px 14px", transition: "color 0.2s",
          }}>@codetechsoftware</a>
        </div>
      </footer>
    </div>
  );
};

export default Index;