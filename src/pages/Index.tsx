import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, Users, MessageCircle, CreditCard, BarChart3, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: Users, title: "Gestão de Clientes", description: "Cadastre e gerencie todos os seus clientes em um só lugar" },
    { icon: CreditCard, title: "Pagamentos PIX", description: "Integração com chaves PIX para recebimentos rápidos" },
    { icon: MessageCircle, title: "WhatsApp Automático", description: "Envio automatizado de cobranças via WhatsApp" },
    { icon: BarChart3, title: "Dashboard Completo", description: "Visualize estatísticas e acompanhe seu negócio" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-strong">
              <Wallet className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
            SJ Gestor
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo de gestão de cobranças com integração WhatsApp
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-lg px-8 shadow-medium hover:shadow-strong transition-shadow"
            >
              <Zap className="w-5 h-5 mr-2" />
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-lg px-8"
            >
              Fazer Login
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-medium">
            <h2 className="text-3xl font-bold text-center mb-8">Por que escolher o SJ Gestor?</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">✓</div>
                <div>
                  <h4 className="font-semibold mb-1">Automatize suas cobranças</h4>
                  <p className="text-muted-foreground">Envie lembretes de pagamento automaticamente via WhatsApp</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">✓</div>
                <div>
                  <h4 className="font-semibold mb-1">Controle total</h4>
                  <p className="text-muted-foreground">Gerencie produtos, clientes e chaves PIX em uma plataforma única</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold">✓</div>
                <div>
                  <h4 className="font-semibold mb-1">Fácil de usar</h4>
                  <p className="text-muted-foreground">Interface intuitiva e moderna, sem complicações</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 SJ Gestor. Sistema de gestão de cobranças.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
