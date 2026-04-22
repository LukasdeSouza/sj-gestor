import {
  LayoutDashboard, Users, LogOut, Menu, X,
  Wallet, Settings, User as UserIcon, HelpCircle,
  Receipt, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthUser } from "@/api/models/auth";
import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import CobrLogo from "../assets/logo.png";
import Cookies from "js-cookie";
import { OnboardingSpotlight } from "./Onboarding/OnboardingSpotlight";
import { TourProvider } from "./Onboarding/TourProvider";
import { OnboardingWelcome } from "./Onboarding/OnboardingWelcome";
import NotificationCenter from "./Notifications/NotificationCenter";
import { TrialExpiredGate } from "./TrialExpiredGate";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const sub = useSubscriptionGuard({ protect: true });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { pathname } = useLocation();
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const handleLogout = () => {
    Cookies.remove(USER_COOKIE_KEY);
    Cookies.remove(TOKEN_COOKIE_KEY);
    navigate("/auth");
    toast({ title: "Logout realizado", description: "Até breve!" });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Analytics",    path: "/dashboard" },
    { icon: Users,           label: "Cobranças",     path: "/clients" },
    // { icon: Receipt,         label: "Clientes",      path: "/billing-overview" },
    { icon: Settings,        label: "Configurações", path: "/settings" },
    ...(parsedUser?.group?.name === "ADMIN"
      ? [{ icon: UserIcon, label: "Usuários & Comprovantes", path: "/users" }]
      : []),
    ...(parsedUser?.group?.name === "USUARIO_CLIENTE"
      ? [{ icon: Wallet, label: "Pagamentos", path: "/payments" }]
      : []),
    { icon: Wallet,          label: "Meios de Pagamento", path: "/meios-pagamento" },
    { icon: HelpCircle, label: "Ajuda", path: "/help" },
  ];

  const initials = parsedUser?.name
    ? parsedUser.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <TourProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── tokens ── */
        .dl {
          --cobr: #00C896;
          --cobr-dim: #00A87E;
          --cobr-glow: rgba(0,200,150,0.1);
          --cobr-line: rgba(0,200,150,0.2);
          --bg:    #090C0A;
          --bg2:   #0D1210;
          --bg3:   #111614;
          --border: rgba(255,255,255,0.06);
          --text:  #F0F5F2;
          --text2: #C0D5CC;
          --muted: #5A7A70;
          --muted2: #3A5A50;
          font-family: 'DM Sans', sans-serif;
          color: var(--text);
        }

        /* ── shell ── */
        .dl-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        /* ══════════════════════════════
           SIDEBAR
        ══════════════════════════════ */
        .dl-sidebar {
          position: fixed;
          top: 0; left: 0;
          height: 100%;
          width: 220px;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 50;
          transition: transform 0.28s cubic-bezier(.4,0,.2,1);
        }

        /* LOGO */
        .dl-logo-wrap {
          padding: 1.5rem 1.4rem 1.25rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }
        .dl-logo-img {
          width: 30px; height: 30px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .dl-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--cobr);
          letter-spacing: -0.4px;
        }

        /* NAV */
        .dl-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .dl-nav-label {
          font-size: 0.62rem;
          font-weight: 700;
          color: var(--muted2);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          padding: 0 0.6rem;
          margin: 0.75rem 0 0.35rem;
        }
        .dl-nav-label:first-child { margin-top: 0; }

        /* NavLink base — we apply styles via the className props */
        .dl-nav-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          cursor: pointer;
        }
        .dl-nav-item:hover {
          background: rgba(255,255,255,0.04);
          color: var(--text2);
        }
        .dl-nav-item svg {
          width: 15px; height: 15px;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .dl-nav-item-active {
          background: var(--cobr-glow) !important;
          color: var(--cobr) !important;
          border: 1px solid var(--cobr-line);
        }
        .dl-nav-item-active svg { color: var(--cobr); }

        /* BOTTOM USER CHIP */
        .dl-sidebar-footer {
          padding: 1rem 0.75rem;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .dl-user-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.55rem 0.65rem;
          border-radius: 9px;
          background: var(--bg3);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: border-color 0.2s;
          text-align: left;
        }
        .dl-user-trigger:hover { border-color: var(--cobr-line); }
        .dl-user-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: var(--cobr-glow);
          border: 1px solid var(--cobr-line);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.62rem; font-weight: 800;
          color: var(--cobr);
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
        }
        .dl-user-info { flex: 1; min-width: 0; }
        .dl-user-name {
          font-size: 0.78rem; font-weight: 600;
          color: var(--text2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dl-user-status { font-size: 0.66rem; color: var(--cobr); }
        .dl-user-chevron { color: var(--muted); width: 13px; height: 13px; flex-shrink: 0; }

        /* dropdown override */
        .dl-dropdown-content {
          background: var(--bg2) !important;
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          color: var(--text2) !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.82rem !important;
          padding: 0.35rem !important;
          min-width: 180px !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5) !important;
        }
        .dl-dropdown-item {
          border-radius: 7px !important;
          color: var(--text2) !important;
          font-size: 0.82rem !important;
          padding: 0.5rem 0.75rem !important;
          cursor: pointer !important;
          transition: background 0.15s !important;
          display: flex !important; align-items: center !important; gap: 0.5rem !important;
        }
        .dl-dropdown-item:hover { background: rgba(255,255,255,0.05) !important; }
        .dl-dropdown-item.danger { color: #E84545 !important; }
        .dl-dropdown-item.danger:hover { background: rgba(232,69,69,0.08) !important; }
        .dl-dropdown-sep { background: var(--border) !important; margin: 0.3rem 0 !important; }

        /* ══════════════════════════════
           MOBILE HEADER
        ══════════════════════════════ */
        .dl-mobile-header {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          z-index: 40;
        }
        .dl-mobile-logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem; font-weight: 800;
          color: var(--cobr); letter-spacing: -0.4px;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .dl-mobile-logo img { width: 24px; height: 24px; object-fit: contain; }
        .dl-hamburger {
          background: none; border: none; cursor: pointer;
          color: var(--muted); padding: 6px;
          border-radius: 7px; transition: background 0.15s, color 0.15s;
          display: flex; align-items: center;
        }
        .dl-hamburger:hover { background: rgba(255,255,255,0.05); color: var(--text); }
        .dl-hamburger svg { width: 20px; height: 20px; }

        /* ══════════════════════════════
           OVERLAY
        ══════════════════════════════ */
        .dl-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 40;
        }

        /* ══════════════════════════════
           MAIN
        ══════════════════════════════ */
        .dl-main {
          margin-left: 220px;
          flex: 1;
          min-width: 0;
          background: var(--bg);
        }
        .dl-main-inner {
          padding: 1rem 2rem 2rem;
        }

        /* ── top header (desktop) ── */
        .dl-top-header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 2rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 30;
        }

        /* ══════════════════════════════
           RESPONSIVE
        ══════════════════════════════ */
        /* ── usage widget ── */
        .dl-usage {
          margin: 0.75rem 0.75rem 0.25rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .dl-usage-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.5rem;
        }
        .dl-usage-label { font-size: 0.62rem; font-weight: 700; color: var(--muted); text-transform: uppercase; }
        .dl-usage-val { font-size: 0.65rem; font-weight: 600; color: var(--text2); }
        .dl-usage-bar-bg { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
        .dl-usage-bar-fill { height: 100%; transition: width 0.5s ease; border-radius: 2px; }

        /* ── trial banner ── */
        .dl-banner {
          background: linear-gradient(90deg, var(--cobr-glow), rgba(0,200,150,0.02));
          border-bottom: 1px solid var(--cobr-line);
          padding: 0.6rem 1.25rem;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          font-size: 0.8rem; font-weight: 500;
          color: var(--text2);
          animation: slideDown 0.4s ease;
        }
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .dl-banner b { color: var(--cobr); }
        .dl-banner-btn {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          background: var(--cobr); color: var(--bg);
          padding: 0.25rem 0.6rem; border-radius: 4px;
          cursor: pointer; transition: opacity 0.2s;
        }
        .dl-banner-btn:hover { opacity: 0.9; }

        /* ── captive portal (soft lock) ── */
        .dl-captive {
          position: fixed; inset: 0;
          z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem;
          background: rgba(9,12,10,0.4);
          backdrop-filter: blur(8px);
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .dl-captive-card {
          width: 100%; max-width: 440px;
          background: var(--bg2);
          border: 1px solid var(--cobr-line);
          border-radius: 24px;
          padding: 2.5rem;
          text-align: center;
          box-shadow: 0 32px 64px rgba(0,0,0,0.6);
        }
        .dl-captive-icon {
          width: 56px; height: 56px; margin: 0 auto 1.5rem;
          background: var(--cobr-glow); color: var(--cobr);
          border-radius: 16px; display: flex; align-items: center; justify-content: center;
        }
        .dl-captive-title { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; margin-bottom: 0.75rem; }
        .dl-captive-text { font-size: 0.95rem; color: var(--text2); line-height: 1.6; margin-bottom: 2rem; }
        .dl-captive-btn {
          width: 100%; padding: 1rem; border-radius: 12px;
          background: var(--cobr); color: var(--bg);
          font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: transform 0.2s;
        }
        .dl-captive-btn:hover { transform: scale(1.02); }

        @media (max-width: 1024px) {
          .dl-sidebar { transform: translateX(-100%); }
          .dl-sidebar.open { transform: translateX(0); }
          .dl-mobile-header { display: flex; }
          .dl-main { margin-left: 0; padding-top: 56px; }
          .dl-main-inner { padding: 1.25rem; }
          .dl-top-header { display: none; }
        }
      `}</style>

      <div className="dl">
        <div className="dl-shell">

          {/* ══ MOBILE HEADER ══ */}
          <div className="dl-mobile-header">
            <div className="dl-mobile-logo">
              <img src={CobrLogo} alt="Cobr" />
              cobr.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <NotificationCenter userId={parsedUser?.id || ""} />
                <button
                    className="dl-hamburger"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Menu"
                >
                    {sidebarOpen ? <X /> : <Menu />}
                </button>
            </div>
          </div>

          {/* ══ SIDEBAR ══ */}
          <aside className={`dl-sidebar${sidebarOpen ? " open" : ""}`}>

            {/* Logo */}
            <div className="dl-logo-wrap">
              <img src={CobrLogo} alt="Cobr" className="dl-logo-img" />
              <span className="dl-logo-text">cobr.</span>
            </div>

            {/* Nav */}
            <nav className="dl-nav">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="dl-nav-item"
                  activeClassName="dl-nav-item-active"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Usage Sidebar Widget */}
            {sub?.usage && (
              <div className="dl-usage">
                <div className="dl-usage-head">
                  <span className="dl-usage-label">Uso do Plano</span>
                  <span className="dl-usage-val">
                    {sub.usage.current} / {sub.usage.limit || '∞'}
                  </span>
                </div>
                <div className="dl-usage-bar-bg">
                  <div 
                    className="dl-usage-bar-fill" 
                    style={{ 
                      width: `${Math.min(100, (sub.usage.current / (sub.usage.limit || 1)) * 100)}%`,
                      backgroundColor: (sub.usage.current / (sub.usage.limit || 1)) > 0.9 ? '#E84545' : 'var(--cobr)'
                    }} 
                  />
                </div>
              </div>
            )}

            {/* User footer */}
            <div className="dl-sidebar-footer">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="dl-user-trigger">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5Dh-hCRQx8d2VZzrmMMLcpUhAh53KlS1s5A&s" className="dl-user-avatar"/>
                    {/* <div className="dl-user-avatar">{initials}</div> */}
                    <div className="dl-user-info">
                      <div className="dl-user-name">{parsedUser?.name || "Usuário"}</div>
                      <div className="dl-user-status">Conta ativa</div>
                    </div>
                    <ChevronDown className="dl-user-chevron" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="dl-dropdown-content"
                >
                  <DropdownMenuItem
                    className="dl-dropdown-item"
                    onSelect={() => navigate("/plans")}
                  >
                    <Wallet size={13} />
                    Planos e Pagamentos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dl-dropdown-sep" />
                  <DropdownMenuItem
                    className="dl-dropdown-item danger"
                    onSelect={handleLogout}
                  >
                    <LogOut size={13} />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>

          {/* ══ OVERLAY mobile ══ */}
          {sidebarOpen && (
            <div
              className="dl-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ══ MAIN ══ */}
          <main className="dl-main">
            <div className="dl-top-header">
                <NotificationCenter userId={parsedUser?.id || ""} />
            </div>
            <OnboardingWelcome />
            <OnboardingSpotlight />
            {/* Trial Banner — só aparece após selecionar plano FREE e enquanto trial não expirou */}
            {sub?.trial?.isActive && !sub?.trial?.isExpired && sub?.status === "ACTIVE" && pathname !== "/plans" && (
              <div className="dl-banner">
                <span>
                  Aproveite seus <b>{sub.trial.daysRemaining} dias</b> de teste gratuito.
                </span>
                <div className="dl-banner-btn" onClick={() => navigate('/plans')}>
                  Ver Planos
                </div>
              </div>
            )}

            <div className="dl-main-inner">
              {children}
            </div>
          </main>

          {/* ══ CAPTIVE PORTAL (Trial Expired) ══ */}
          {sub?.trial?.isExpired && pathname !== "/plans" && <TrialExpiredGate />}

        </div>
      </div>
    </TourProvider>
  );
};

export default DashboardLayout;