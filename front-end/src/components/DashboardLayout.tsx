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
import CobrLogo from "../assets/logo.png";
import Cookies from "js-cookie";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  useSubscriptionGuard({ protect: true });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { icon: HelpCircle, label: "Ajuda", path: "/help" },
  ];

  const initials = parsedUser?.name
    ? parsedUser.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <>
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
          padding: 2rem 2rem;
        }

        /* ══════════════════════════════
           RESPONSIVE
        ══════════════════════════════ */
        @media (max-width: 1024px) {
          .dl-sidebar { transform: translateX(-100%); }
          .dl-sidebar.open { transform: translateX(0); }
          .dl-mobile-header { display: flex; }
          .dl-main { margin-left: 0; padding-top: 56px; }
          .dl-main-inner { padding: 1.25rem; }
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
            <button
              className="dl-hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menu"
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
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

            {/* User footer */}
            <div className="dl-sidebar-footer">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="dl-user-trigger">
                    <div className="dl-user-avatar">{initials}</div>
                    <div className="dl-user-info">
                      <div className="dl-user-name">{parsedUser?.name || "Usuário"}</div>
                      <div className="dl-user-status">● Conta ativa</div>
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
            <div className="dl-main-inner">
              {children}
            </div>
          </main>

        </div>
      </div>
    </>
  );
};

export default DashboardLayout;