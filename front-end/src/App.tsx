import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionPending from "./pages/SubscriptionPending";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import SubscriptionError from "./pages/SubscriptionError";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Templates from "./pages/Templates";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ToastContainer />
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
            <Route path="/whatsapp" element={<WhatsApp />} />
            <Route path="/account" element={<Account />} />
            <Route path="/users" element={<Users />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
