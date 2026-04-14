import DashboardLayout from "@/components/DashboardLayout";
import { AuthUser } from "@/api/models/auth";
import { useState } from "react";
import Cookies from "js-cookie";
import {
  Users, Package, CreditCard, MessageSquare, Smartphone,
  HelpCircle, FileText, Wallet, User, MessageCircleQuestion,
  LifeBuoy, AlertTriangle, ChevronRight, Sparkles, Zap,
  Shield, Clock, Tag, CheckCircle2, XCircle, Info,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
  accent?: string;
  accentBg?: string;
  content: React.ReactNode;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "#C0D5CC", letterSpacing: -0.3, margin: "0 0 0.85rem" }}>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#A0C0B8", margin: "1.1rem 0 0.35rem" }}>
      {children}
    </h3>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.82rem", color: "#6A8A80", lineHeight: 1.75, margin: 0 }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "1rem 0" }} />;
}

function InfoBox({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warn" | "tip" }) {
  const map = {
    info: { bg: "rgba(0,200,150,0.06)",  border: "rgba(0,200,150,0.15)",  color: "#00C896", icon: <Info size={13} /> },
    warn: { bg: "rgba(245,166,35,0.07)", border: "rgba(245,166,35,0.2)",  color: "#D4A020", icon: <AlertTriangle size={13} /> },
    tip:  { bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.18)", color: "#818CF8", icon: <Zap size={13} /> },
  };
  const s = map[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 9, padding: "0.75rem 1rem", display: "flex", gap: 8, margin: "0.75rem 0" }}>
      <span style={{ color: s.color, flexShrink: 0, marginTop: 2 }}>{s.icon}</span>
      <span style={{ fontSize: "0.8rem", color: "#7A9087", lineHeight: 1.65 }}>{children}</span>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.62rem", fontWeight: 800, color: "#00C896",
        fontFamily: "'Syne', sans-serif", flexShrink: 0, marginTop: 1,
      }}>
        {n}
      </div>
      <div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#C0D5CC", marginBottom: 2 }}>{title}</div>
        {children && <div style={{ fontSize: "0.78rem", color: "#5A7A70", lineHeight: 1.6 }}>{children}</div>}
      </div>
    </div>
  );
}

function VarPill({ tag, label }: { tag: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.45rem 0.85rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
      <code style={{ fontSize: 11, fontFamily: "monospace", color: "#00C896", background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 4, padding: "1px 6px" }}>{tag}</code>
      <span style={{ fontSize: 12, color: "#5A7A70" }}>{label}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none",
          padding: "0.85rem 0", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}
      >
        <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#C0D5CC", fontFamily: "'Syne', sans-serif" }}>{q}</span>
        <ChevronRight size={14} style={{ color: "#3A5A50", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ paddingBottom: "0.85rem" }}>
          <Prose>{a}</Prose>
        </div>
      )}
    </div>
  );
}

function HoursCard() {
  return (
    <div style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.15)", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
      <Clock size={15} color="#00C896" style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00C896", marginBottom: 2 }}>Horário de suporte</div>
        <div style={{ fontSize: "0.76rem", color: "#5A7A70" }}>Segunda a Sexta: 9h às 18h &nbsp;·&nbsp; Sábado: 9h às 12h</div>
      </div>
    </div>
  );
}

// ─── SECTION CONTENT ─────────────────────────────────────────────────────────

const GeneralContent = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
    <SectionTitle>Bem-vindo ao Cobr</SectionTitle>
    <Prose>
      O Cobr é uma plataforma de automação de cobranças via WhatsApp. Configure seus clientes, produtos e templates uma vez — e o sistema cuida dos envios automaticamente.
    </Prose>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", margin: "1rem 0" }}>
      {[
        { icon: Zap, title: "Dashboard inteligente", desc: "Métricas de clientes, recebimentos e inadimplência em tempo real." },
        { icon: Shield, title: "Interface simples", desc: "Tudo acessível pelo menu lateral: clientes, produtos, PIX, templates." },
        { icon: Smartphone, title: "WhatsApp nativo", desc: "Conecte seu número e os envios acontecem automaticamente." },
        { icon: MessageSquare, title: "Templates flexíveis", desc: "Crie modelos com variáveis dinâmicas para cada momento." },
      ].map((f, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <f.icon size={13} color="#00C896" />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#C0D5CC", marginBottom: 2 }}>{f.title}</div>
            <div style={{ fontSize: "0.74rem", color: "#4A6A60", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        </div>
      ))}
    </div>

    <Divider />
    <SubTitle>Fluxo básico de uso</SubTitle>
    <Step n={1} title="Conecte o WhatsApp">Vá em Configurações → WhatsApp e escaneie o QR Code.</Step>
    <Step n={2} title="Cadastre seus produtos">Defina nome e valor dos serviços que você cobra.</Step>
    <Step n={3} title="Adicione clientes">Informe nome, telefone e data de vencimento.</Step>
    <Step n={4} title="Ative a régua de cobrança">O sistema passa a enviar mensagens automaticamente nos dias configurados.</Step>
  </div>
);

const FaqContent = () => (
  <div>
    <SectionTitle>Perguntas frequentes</SectionTitle>
    <Prose>Clique na pergunta para expandir a resposta.</Prose>
    <div style={{ marginTop: "1rem" }}>
      {[
        { q: "Como resetar minha senha?", a: "Na tela de login, clique em 'Esqueceu sua senha?'. Você receberá um e-mail com instruções para criar uma nova senha." },
        { q: "O WhatsApp desconectou, o que fazer?", a: "Acesse Configurações → WhatsApp. Se o status estiver desconectado, clique em Conectar e escaneie o QR Code novamente. Certifique-se de que o celular esteja com internet." },
        { q: "Como funcionam as cobranças automáticas?", a: "O sistema verifica diariamente os clientes com vencimento próximo. Se o WhatsApp estiver conectado e a régua ativa, a mensagem do template configurado é enviada automaticamente." },
        { q: "Posso alterar meu plano?", a: "Sim. Clique no seu nome na barra lateral e selecione 'Planos e Pagamentos'." },
        { q: "Como cadastro uma chave PIX?", a: "Vá em Configurações → Chaves PIX, clique em Nova Chave, selecione o tipo (CPF, Email, etc.) e informe a chave. Ela será incluída automaticamente nas mensagens de cobrança." },
        { q: "Quais os horários de disparo das mensagens?", a: "Manhã: 8h–10h | Tarde: 15h–17h | Noite: 20h–22h. Os horários são escalonados para evitar bloqueio pelo WhatsApp." },
      ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
    </div>
  </div>
);

const ClientsContent = () => (
  <div>
    <SectionTitle>Gerenciamento de clientes</SectionTitle>
    <Prose>Cadastre clientes, registre pagamentos e acompanhe o histórico financeiro de cada um.</Prose>
    <Divider />
    <SubTitle>Cadastrar cliente</SubTitle>
    <Step n={1} title="Acesse a página Cobranças no menu lateral" />
    <Step n={2} title='Clique em "Novo Cliente"' />
    <Step n={3} title="Preencha nome, telefone (com DDD) e data de vencimento" />
    <Step n={4} title="Ative a régua de cobrança para envios automáticos" />
    <Divider />
    <SubTitle>Registrar pagamento</SubTitle>
    <Prose>Na lista de clientes, clique em "Ver detalhes" sobre o cliente desejado. Dentro do modal, clique em "Registrar Pagamento" e informe o valor e a data.</Prose>
    <InfoBox type="tip">O histórico de pagamentos fica visível dentro do modal do cliente, com paginação.</InfoBox>
    <Divider />
    <SubTitle>Filtros disponíveis</SubTitle>
    <Prose>Use os filtros A-Z, Vencimento e Inadimplentes na barra de busca para encontrar clientes rapidamente.</Prose>
  </div>
);

const ProductsHelpContent = () => (
  <div>
    <SectionTitle>Produtos e serviços</SectionTitle>
    <Prose>Cadastre os itens que você cobra e associe-os aos seus clientes.</Prose>
    <Divider />
    <SubTitle>Cadastrar produto</SubTitle>
    <Step n={1} title='Vá em Configurações → Produtos e clique em "Novo Produto"' />
    <Step n={2} title="Informe o nome, descrição (opcional) e valor padrão" />
    <Step n={3} title="O produto ficará disponível ao cadastrar/editar clientes" />
    <InfoBox type="info">No plano gratuito o limite é de 5 produtos. Faça upgrade para ter produtos ilimitados.</InfoBox>
  </div>
);

const PixHelpContent = () => (
  <div>
    <SectionTitle>Chaves PIX</SectionTitle>
    <Prose>As chaves PIX cadastradas são enviadas automaticamente nas mensagens de cobrança, facilitando o pagamento pelo cliente.</Prose>
    <Divider />
    <SubTitle>Cadastrar chave</SubTitle>
    <Step n={1} title='Vá em Configurações → Chaves PIX e clique em "Nova Chave"' />
    <Step n={2} title="Selecione o tipo: CPF, CNPJ, E-mail, Telefone ou Aleatória" />
    <Step n={3} title="Digite a chave e salve" />
    <Divider />
    <SubTitle>Tipos de chave suportados</SubTitle>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "0.5rem" }}>
      {["CPF", "CNPJ", "E-mail", "Telefone", "Aleatória"].map((t) => (
        <span key={t} style={{ background: "rgba(0,200,150,0.07)", border: "1px solid rgba(0,200,150,0.15)", color: "#00C896", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{t}</span>
      ))}
    </div>
    <InfoBox type="tip">Você pode cadastrar múltiplas chaves. A chave enviada na mensagem pode ser configurada nos templates.</InfoBox>
  </div>
);

const TemplatesHelpContent = () => (
  <div>
    <SectionTitle>Templates de mensagem</SectionTitle>
    <Prose>Crie modelos reutilizáveis para cada momento da cobrança: aviso, vencimento, atraso e confirmação de pagamento.</Prose>
    <Divider />
    <SubTitle>Criar template</SubTitle>
    <Step n={1} title='Vá em Configurações → Templates e clique em "Novo Template"' />
    <Step n={2} title="Dê um nome ao modelo e escreva a mensagem" />
    <Step n={3} title="Use as variáveis disponíveis para personalizar automaticamente" />
    <Step n={4} title='Confira o Preview antes de salvar' />
    <Divider />
    <SubTitle>Variáveis disponíveis</SubTitle>
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "0.5rem" }}>
      {[
        { tag: "{nome}",       label: "Nome do cliente"      },
        { tag: "{valor}",      label: "Valor da cobrança"    },
        { tag: "{vencimento}", label: "Data de vencimento"   },
        { tag: "{email}",      label: "E-mail do cliente"    },
        { tag: "{telefone}",   label: "Telefone do cliente"  },
        { tag: "{dias}",       label: "Dias em atraso"       },
      ].map((v) => <VarPill key={v.tag} tag={v.tag} label={v.label} />)}
    </div>
    <InfoBox type="info">Os templates padrão são somente leitura. Crie templates próprios para personalizar suas mensagens.</InfoBox>
  </div>
);

const WhatsAppHelpContent = () => (
  <div>
    <SectionTitle>Integração WhatsApp</SectionTitle>
    <Prose>Conecte seu número para que o Cobr envie as cobranças automaticamente pelo WhatsApp.</Prose>
    <Divider />
    <SubTitle>Como conectar</SubTitle>
    <Step n={1} title="Acesse Configurações → WhatsApp" />
    <Step n={2} title="Digite o número com DDD (somente números)" />
    <Step n={3} title='Clique em "Conectar WhatsApp" e aguarde o QR Code' />
    <Step n={4} title="No celular: WhatsApp → Configurações → Aparelhos Vinculados → Vincular aparelho" />
    <Step n={5} title="Escaneie o QR Code e aguarde a sincronização (até 1 min)" />
    <InfoBox type="warn">Não feche a janela do QR Code durante a sincronização. O código expira em 60 segundos.</InfoBox>
    <Divider />
    <SubTitle>Horários de disparo</SubTitle>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem", marginTop: "0.5rem" }}>
      {[
        { period: "Manhã",  time: "8h às 10h"  },
        { period: "Tarde",  time: "15h às 17h" },
        { period: "Noite",  time: "20h às 22h" },
      ].map((h) => (
        <div key={h.period} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "0.6rem 0.85rem", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", color: "#3A5A50", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h.period}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.88rem", fontWeight: 800, color: "#00C896", marginTop: 2 }}>{h.time}</div>
        </div>
      ))}
    </div>
    <Prose style={{ marginTop: "0.5rem" }}>Os disparos são escalonados entre esses períodos para evitar bloqueio pelo WhatsApp.</Prose>
  </div>
);

const WhatsAppIssuesContent = () => (
  <div>
    <SectionTitle>Problemas com WhatsApp</SectionTitle>
    <Prose>Soluções para os problemas mais comuns de conexão e envio.</Prose>
    <Divider />
    {[
      {
        q: "Não estou conseguindo conectar meu WhatsApp",
        a: "Remova a conexão no app do WhatsApp (Aparelhos Vinculados → desconectar) e tente novamente na plataforma com o número no formato correto: (xx) 9xxxx-xxxx.",
        ok: false,
      },
      {
        q: "Conectei mas a plataforma não reconheceu",
        a: "Aguarde a sincronização — ela aparece diretamente no WhatsApp do celular. Após concluir, recarregue a tela. Se persistir, entre em contato com o suporte informando seu e-mail.",
        ok: false,
      },
      {
        q: "Dificuldade com WhatsApp Business",
        a: "Tente remover a conexão anterior e reconectar. Se nunca conectou, tente outro número não-Business. Se o problema continuar, acione o suporte com seu e-mail cadastrado.",
        ok: false,
      },
      {
        q: "Desconectei e não consigo reconectar",
        a: "Sua sessão anterior pode não ter sido completamente encerrada. Entre em contato com o suporte informando seu e-mail.",
        ok: false,
      },
      {
        q: "Mensagem não chegou ao cliente",
        a: "Confirme que o telefone está no formato (xx) 9xxxx-xxxx. Se estiver errado, corrija-o no cadastro do cliente. Se o formato estiver correto, remova e recadastre o cliente e aguarde o próximo ciclo.",
        ok: false,
      },
    ].map((item, i) => (
      <div key={i} style={{ display: "flex", gap: 10, padding: "0.85rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <XCircle size={14} style={{ color: "#E84545", flexShrink: 0, marginTop: 3 }} />
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#C0D5CC", marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>{item.q}</div>
          <div style={{ fontSize: "0.78rem", color: "#5A7A70", lineHeight: 1.65 }}>{item.a}</div>
        </div>
      </div>
    ))}

    <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
      <button
        onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#00C896", color: "#051A12", border: "none",
          borderRadius: 10, padding: "0.75rem 1.5rem",
          fontFamily: "'Syne', sans-serif", fontSize: "0.88rem", fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <LifeBuoy size={15} /> Falar com suporte
      </button>
    </div>
  </div>
);

const PaymentsHelpContent = () => (
  <div>
    <SectionTitle>Histórico de pagamentos</SectionTitle>
    <Prose>Acompanhe e gerencie as faturas da sua assinatura do Cobr.</Prose>
    <Divider />
    <SubTitle>Onde encontrar</SubTitle>
    <Prose>Acesse Pagamentos no menu lateral para ver todas as faturas, status e comprovantes da sua assinatura.</Prose>
    <InfoBox type="info">Se o seu pagamento foi feito via PIX e ainda não foi aprovado, aguarde a confirmação manual por parte do suporte.</InfoBox>
  </div>
);

const UsersHelpContent = () => (
  <div>
    <SectionTitle>Gestão de usuários & pagamentos</SectionTitle>
    <Prose>Administração completa dos usuários e aprovação de comprovantes de pagamento.</Prose>
    <Divider />
    <SubTitle>Gerenciar usuários</SubTitle>
    <Prose>Acesse Usuários no menu lateral para visualizar todos os cadastros. Você pode editar informações, alterar planos e monitorar o status das assinaturas.</Prose>
    <Divider />
    <SubTitle>Aprovar pagamentos</SubTitle>
    <Step n={1} title="Acesse a aba Usuários" />
    <Step n={2} title="Localize o usuário com pagamento pendente" />
    <Step n={3} title="Visualize o comprovante de PIX enviado" />
    <Step n={4} title="Aprove ou rejeite o pagamento" />
    <InfoBox type="warn">Após a aprovação, o plano do usuário é ativado imediatamente. Confirme o comprovante antes de aprovar.</InfoBox>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Help() {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;
  const isAdmin  = parsedUser?.group?.name === "ADMIN";
  const isClient = parsedUser?.group?.name === "USUARIO_CLIENTE";

  const [activeSection, setActiveSection] = useState("general");

  const sections: Section[] = [
    { id: "general",          label: "Visão geral",         icon: Sparkles,             content: <GeneralContent /> },
    { id: "faq",              label: "FAQ",                  icon: MessageCircleQuestion, content: <FaqContent /> },
    { id: "clients",          label: "Clientes",             icon: Users,                content: <ClientsContent /> },
    { id: "products",         label: "Produtos",             icon: Package,              content: <ProductsHelpContent /> },
    { id: "pix",              label: "Chaves PIX",           icon: CreditCard,           content: <PixHelpContent /> },
    { id: "templates",        label: "Templates",            icon: FileText,             content: <TemplatesHelpContent /> },
    { id: "whatsapp",         label: "WhatsApp",             icon: Smartphone,           content: <WhatsAppHelpContent /> },
    { id: "whatsapp-issues",  label: "Problemas WhatsApp",   icon: AlertTriangle,        accent: "#E84545", accentBg: "rgba(232,69,69,0.08)", content: <WhatsAppIssuesContent /> },
    ...(isClient ? [{ id: "payments", label: "Pagamentos", icon: Wallet, content: <PaymentsHelpContent /> }] : []),
    ...(isAdmin  ? [{ id: "users",    label: "Usuários",   icon: User,   content: <UsersHelpContent /> }]    : []),
  ];

  const active = sections.find((s) => s.id === activeSection) ?? sections[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .help-nav-item { transition: background 0.15s, color 0.15s; }
        .help-nav-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <DashboardLayout>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#F0F5F2", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* ── HEADER ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HelpCircle size={18} color="#00C896" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.5, margin: 0 }}>
                Central de Ajuda
              </h1>
              <p style={{ fontSize: "0.78rem", color: "#5A7A70", margin: 0 }}>Tutoriais, guias e suporte</p>
            </div>
          </div>

          <HoursCard />

          {/* ── LAYOUT ── */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1rem", alignItems: "start" }}>

            {/* SIDEBAR NAV */}
            <div style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.5rem", display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: "1rem" }}>
              {sections.map((s) => {
                const isActive = s.id === activeSection;
                return (
                  <button
                    key={s.id}
                    className="help-nav-item"
                    onClick={() => setActiveSection(s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "0.5rem 0.7rem", borderRadius: 8, border: "none",
                      background: isActive ? "rgba(0,200,150,0.1)" : "transparent",
                      color: isActive ? "#00C896" : (s.accent ?? "#5A7A70"),
                      fontSize: "0.78rem", fontWeight: isActive ? 700 : 500,
                      fontFamily: isActive ? "'Syne', sans-serif" : "'DM Sans', sans-serif",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      ...(isActive ? { borderLeft: "2px solid #00C896" } : { borderLeft: "2px solid transparent" }),
                    }}
                  >
                    <s.icon size={13} style={{ flexShrink: 0 }} />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* CONTENT PANEL */}
            <div style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1.5rem" }}>
              {active.content}
            </div>

          </div>
        </div>
      </DashboardLayout>
    </>
  );
}