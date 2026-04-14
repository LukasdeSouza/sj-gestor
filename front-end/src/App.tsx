import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionPending from "./pages/SubscriptionPending";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import SubscriptionError from "./pages/SubscriptionError";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import BillingOverview from "./pages/BillingOverview";
import TemplatesUnified from "./pages/TemplatesUnified";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import WhatsApp from "./pages/WhatsApp";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";
import PixKeys from "./pages/PixKeys";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Users from "./pages/Users";
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Help from "./pages/Help";
import { NichoSelection } from "./pages/NichoSelection";
import { BillingRules } from "./pages/BillingRules";
import PaymentPage from "./pages/PaymentPage";
import UpdatesBanner from "./components/UpdatesBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
// import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <ErrorBoundary>
        <Toaster />
        <MaintenanceBanner isActive={false}/>
        <UpdatesBanner
          isActive={false} 
          version="1.0.19"
          updates={[
            { title: "Conferência em Desconexão Automática", description: "Fizemos a validação de desconexões automáticas que aconteciam com alguns números para correção" },
            { title: "Erro ao mostrar 'Cobranças de Hoje'", description: "Estamos cientes quanto a este erro e faremos a atualização dia 20/02 no período da noite, provavelmente sendo necessário reconectar whatsapp novamente via QRCode"},
            { title: "Confirmação ao Desconectar Whatsapp", description: "Foi adicionado modal para confirmação de Desconexão de Whatsapp para segurança do usuário"},
            { title: "Confirmação ao Conectar Whatsapp", description: "Foi adicionado modal para confirmação de conexão de Whatsapp para segurança do usuário"},            
            { title: "Carregando em Dashboard", description: "Adição de loader e loading de carregamento na tela de Dashboard"}
          ]}
        />
        <Sonner />
        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable={false}
          toastStyle={{
            background: "#0D1210",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            color: "#C0D5CC",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/assinatura/sucesso" element={<SubscriptionSuccess />} />
            <Route path="/assinatura/erro" element={<SubscriptionError />} />
            <Route path="/assinatura/pendente" element={<SubscriptionPending />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/products" element={<Products />} />
            <Route path="/pix-keys" element={<PixKeys />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/billing-overview" element={<BillingOverview />} />
            <Route path="/templates-unified" element={<TemplatesUnified />} />
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/account" element={<Account />} />
            <Route path="/users" element={<Users />} />
            <Route path="/help" element={<Help />} />
            <Route path="/nicho-selection" element={<NichoSelection />} />
            <Route path="/billing-rules/:clientId" element={<BillingRules />} />
            <Route path="/pagar/:token" element={<PaymentPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
