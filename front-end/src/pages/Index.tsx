import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, CreditCard, BarChart3, Zap, Instagram, Sparkles, Shield, Clock, TrendingUp, ArrowRight, CheckCircle2, Star, Smartphone } from "lucide-react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const Index = () => {
  const navigate = useNavigate();

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  const features = [
    { icon: Smartphone, title: "WhatsApp Automatizado", description: "Envie cobranças automáticas e lembretes via WhatsApp com templates personalizados" },
    { icon: CreditCard, title: "PIX Inteligente", description: "Múltiplas chaves PIX integradas para facilitar pagamentos instantâneos" },
    { icon: Users, title: "Gestão Completa", description: "Controle total de clientes, produtos e histórico de pagamentos" },
    { icon: TrendingUp, title: "Analytics Avançado", description: "Dashboard em tempo real com métricas e insights para seu negócio" },
  ];

  const benefits = [
    { icon: Clock, title: "Economize 10+ horas/semana", description: "Automatize cobranças manuais e foque no que realmente importa" },
    { icon: TrendingUp, title: "Aumente 30% seus recebimentos", description: "Lembretes automáticos reduzem inadimplência e aceleram pagamentos" },
    { icon: Shield, title: "100% Seguro e Confiável", description: "Dados criptografados e backup automático para sua tranquilidade" },
    { icon: Sparkles, title: "Interface Intuitiva", description: "Design moderno e fácil de usar, sem necessidade de treinamento" },
  ];

  const stats = [
    { value: "2.500+", label: "Clientes Ativos" },
    { value: "R$ 2M+", label: "Processados" },
    { value: "98%", label: "Satisfação" },
    { value: "24/7", label: "Suporte" },
  ];

  return (
    <div className="min-h-screen bg-dark-gradient">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-cobr-gradient flex items-center justify-center hover-lift">
              <span className="text-white font-bold text-3xl">C</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Cobr: <span className="text-cobr-500">Automação</span> de Cobranças que
              <span className="text-cobr-500"> Transforma</span> seu Negócio
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Sistema inteligente de gestão de cobranças com WhatsApp automatizado. 
              Economize tempo, reduza inadimplência e aumente seus recebimentos em <span className="text-cobr-500 font-semibold">30 dias</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-lg px-8 bg-cobr-600 hover:bg-cobr-700 shadow-medium hover:shadow-strong transition-all hover:-translate-y-1"
            >
              <Zap className="w-5 h-5 mr-2" />
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-lg px-8 border-cobr-200 text-cobr-600 hover:bg-cobr-50"
            >
              Fazer Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 pt-8">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <span className="text-muted-foreground">
              <strong className="text-foreground">4.9/5</strong> (500+ avaliações)
            </span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cobr-600 mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all hover:-translate-y-1 border border-cobr-100"
            >
              <div className="w-12 h-12 rounded-xl bg-cobr-gradient flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Resultados <span className="text-cobr-600">Comprovados</span> em 30 Dias
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Veja como o Cobr transforma a gestão de cobranças de milhares de negócios
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-cobr-50 border border-cobr-200 rounded-2xl p-6 hover-lift">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cobr-gradient flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-cobr-800">{benefit.title}</h4>
                    <p className="text-cobr-700">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-cobr-600 to-cobr-500 rounded-3xl p-8 md:p-12 text-center text-white shadow-strong">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Revolucionar suas Cobranças?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Junte-se a 2.500+ empresas que já economizam tempo e aumentam recebimentos com o Cobr
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-lg px-8 bg-white text-cobr-600 hover:bg-gray-100 shadow-medium hover:shadow-strong transition-all hover:-translate-y-1"
            >
              <Zap className="w-5 h-5 mr-2" />
              Começar Agora - Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm mt-4 opacity-75">
              Sem cartão de crédito • Cancelamento a qualquer momento
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-cobr-200 mt-24 py-8 bg-cobr-50">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center text-muted-foreground md:flex-row md:justify-center md:gap-6 md:text-left">
          <p className="text-sm flex flex-row gap-2">
            © 2025 Cobr. Desenvolvido por 
            <a className="underline font-semibold text-cobr-600 hover:text-cobr-700" href="https://codetechsoftware.com.br/br" target="_blank">
              Codetech Software.
            </a>
          </p>
          <a
            href="https://www.instagram.com/codetechsoftware"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-cobr-200 bg-white px-5 py-2 text-sm font-semibold text-cobr-600 transition-colors hover:bg-cobr-100"
          >
            <Instagram className="h-4 w-4" />
            @codetechsoftware
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
