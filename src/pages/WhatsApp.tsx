import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";

interface WhatsAppConnection {
  id: string;
  phone_number: string | null;
  is_connected: boolean;
  last_connected_at: string | null;
}

const WhatsApp = () => {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);

  useEffect(() => {
    fetchConnection();
  }, []);

  const fetchConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setConnection(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integração WhatsApp</h1>
          <p className="text-muted-foreground">
            Configure a conexão com WhatsApp para envio automático de cobranças
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status da Conexão</CardTitle>
                {connection?.is_connected ? (
                  <Badge className="bg-secondary">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Desconectado
                  </Badge>
                )}
              </div>
              <CardDescription>
                Situação atual da integração com WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connection?.phone_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone conectado</p>
                  <p className="text-lg font-medium">{connection.phone_number}</p>
                </div>
              )}
              {connection?.last_connected_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Última conexão</p>
                  <p className="text-lg font-medium">
                    {new Date(connection.last_connected_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                QR Code
              </CardTitle>
              <CardDescription>
                Escaneie o código para conectar o WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground p-8">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Integração WhatsApp em desenvolvimento</p>
                  <p className="text-sm mt-2">
                    O QR Code será exibido aqui quando a integração Baileys estiver ativa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A integração com WhatsApp Business API (Baileys) requer configuração de edge functions
            para gerenciar as conexões e envio de mensagens. Esta funcionalidade está em desenvolvimento.
          </AlertDescription>
        </Alert>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Como funciona?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Conecte seu WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code com seu WhatsApp para estabelecer a conexão
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Configure templates</h4>
                  <p className="text-sm text-muted-foreground">
                    Crie templates de mensagem personalizados para suas cobranças
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Automatize envios</h4>
                  <p className="text-sm text-muted-foreground">
                    Ative a cobrança automática nos clientes e as mensagens serão enviadas automaticamente
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

export default WhatsApp;
