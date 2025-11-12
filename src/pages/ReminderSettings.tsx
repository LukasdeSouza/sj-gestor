import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save, Info } from "lucide-react";

interface ReminderSettings {
  id: string;
  days_before_due: number;
  enabled: boolean;
}

const ReminderSettings = () => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    days_before_due: 3,
    enabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reminder_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast({ variant: "destructive", title: "Erro ao carregar configurações" });
    } else if (data) {
      setSettings(data);
      setFormData({
        days_before_due: data.days_before_due,
        enabled: data.enabled,
      });
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from("reminder_settings")
          .update({
            days_before_due: formData.days_before_due,
            enabled: formData.enabled,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from("reminder_settings")
          .insert({
            user_id: user.id,
            days_before_due: formData.days_before_due,
            enabled: formData.enabled,
          });

        if (error) throw error;
      }

      toast({ title: "Configurações salvas com sucesso!" });
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ 
        variant: "destructive", 
        title: "Erro ao salvar configurações" 
      });
    } finally {
      setSaving(false);
    }
  };

  const testReminder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-upcoming-charges');

      if (error) throw error;

      toast({
        title: "Verificação executada!",
        description: `${data.processed || 0} cobrança(s) processada(s)`,
      });
    } catch (error) {
      console.error("Error testing reminder:", error);
      toast({
        variant: "destructive",
        title: "Erro ao executar verificação",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Carregando configurações...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Configurações de Lembretes
          </h1>
          <p className="text-muted-foreground">
            Configure os lembretes automáticos de cobrança via WhatsApp
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Os lembretes são enviados automaticamente todos os dias às 9h da manhã para cobranças 
            que estão próximas do vencimento. Certifique-se de ter o WhatsApp conectado na página de integração.
          </AlertDescription>
        </Alert>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Personalize o comportamento dos lembretes automáticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled" className="text-base">
                    Ativar lembretes automáticos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembretes automaticamente para cobranças próximas do vencimento
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days_before_due">
                  Dias de antecedência
                </Label>
                <Input
                  id="days_before_due"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.days_before_due}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      days_before_due: parseInt(e.target.value),
                    })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Número de dias antes do vencimento para enviar o lembrete
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testReminder}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Testar Agora
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Verificação Automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Todos os dias às 9h, o sistema verifica cobranças que estão próximas do vencimento
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Envio de Lembretes</h4>
                  <p className="text-sm text-muted-foreground">
                    Para cada cobrança encontrada, um lembrete é enviado via WhatsApp para o cliente
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Registro de Envios</h4>
                  <p className="text-sm text-muted-foreground">
                    Todos os lembretes enviados são registrados na tabela de mensagens
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Evita Duplicatas</h4>
                  <p className="text-sm text-muted-foreground">
                    O sistema verifica se já foi enviado um lembrete no dia para evitar mensagens duplicadas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReminderSettings;
