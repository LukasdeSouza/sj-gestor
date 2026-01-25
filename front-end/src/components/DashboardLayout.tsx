import { LayoutDashboard, Users, Package, CreditCard, MessageSquare, MessageCircle, LogOut, Menu, X, Wallet, FileText, Bell, BadgeDollarSign, Settings, User as UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AuthUser } from "@/api/models/auth";
import { ReactNode, useState } from "react";
import Cookies from "js-cookie";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Protege toda a área logada
  useSubscriptionGuard({ protect: true });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const handleLogout = async () => {

    Cookies.remove(USER_COOKIE_KEY);
    Cookies.remove(TOKEN_COOKIE_KEY);

    navigate("/auth")
    toast({
      title: "Logout realizado",
      description: "Até breve!",
    });
  };

  const openStripePortal = async () => {
    try {
      const res = await fetchUseQuery<undefined, { url?: string }>({ route: "/stripe/portal", method: "POST" });
      if (res?.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        toast({ title: "Portal indisponível", description: "Tente novamente mais tarde." });
      }
    } catch (e) {
      toast({ title: "Falha ao abrir portal", description: "Verifique sua assinatura." });
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: Package, label: "Produtos", path: "/products" },
    { icon: CreditCard, label: "Chaves PIX", path: "/pix-keys" },
    { icon: MessageSquare, label: "Templates", path: "/templates" },
    { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
    ...(parsedUser?.group?.name === 'ADMIN' ? [{ icon: UserIcon, label: "Usuários", path: "/users" }] : []),
    ...(parsedUser?.group?.name === 'USUARIO_CLIENTE' ? [{ icon: Wallet, label: "Pagamentos", path: "/payments" }] : []),
    // { icon: CreditCard, label: "Planos", path: "/plans" },
    // { icon: Settings, label: "Conta", path: "/account" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div> */}
          <span className="font-bold text-lg">SJ Gestor</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border transition-transform duration-300 z-50 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-medium">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div> */}
              <div>
                <h1 className="font-bold text-xl">SJ Gestor</h1>
                <p className="text-xs text-muted-foreground">Gestão de Cobranças</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              activeClassName="bg-accent text-accent-foreground font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[180px]">{parsedUser?.name || "Usuário"}</span>
                  <span className="text-xs text-muted-foreground">Conta ativa</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onSelect={() => navigate("/account")}>Minha conta</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/plans")}>Alterar plano</DropdownMenuItem>
              {/* <DropdownMenuItem onSelect={openStripePortal}>Gerenciar cartão (Stripe)</DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <SubscriptionBanner />
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
