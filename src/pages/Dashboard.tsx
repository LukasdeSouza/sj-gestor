import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, CreditCard, MessageSquare } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    clients: 0,
    products: 0,
    pixKeys: 0,
    templates: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clients, products, pixKeys, templates] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("products").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("pix_keys").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("message_templates").select("id", { count: "exact" }).eq("user_id", user.id),
      ]);

      setStats({
        clients: clients.count || 0,
        products: products.count || 0,
        pixKeys: pixKeys.count || 0,
        templates: templates.count || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Clientes", value: stats.clients, icon: Users, color: "from-primary to-primary/80" },
    { title: "Produtos", value: stats.products, icon: Package, color: "from-secondary to-secondary/80" },
    { title: "Chaves PIX", value: stats.pixKeys, icon: CreditCard, color: "from-primary to-primary/80" },
    { title: "Templates", value: stats.templates, icon: MessageSquare, color: "from-secondary to-secondary/80" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de cobranças
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="overflow-hidden shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Bem-vindo ao PayFlow!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Este é seu sistema de gestão de cobranças com integração WhatsApp.
              Comece cadastrando seus produtos e clientes para enviar cobranças automatizadas.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">1. Configure seus Produtos</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre os produtos ou serviços que você oferece com seus respectivos valores.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">2. Adicione Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre seus clientes e vincule produtos para automatizar cobranças.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">3. Configure Chaves PIX</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione suas chaves PIX para receber pagamentos facilmente.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-accent/50">
                <h3 className="font-semibold mb-2">4. Conecte o WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Vincule sua conta WhatsApp para enviar cobranças automatizadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
