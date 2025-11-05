import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, CheckCircle2, AlertCircle, RefreshCw, Unplug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppConnection {
  id: string;
  phone_number: string | null;
  is_connected: boolean;
  last_connected_at: string | null;
}

const WhatsApp = () => {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [phone, setPhone] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConnection();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setConnection(data);
  };

  const connectWhatsApp = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setWsStatus('connecting');
    setQrCode(null);

    // Validate phone number before connecting
    const raw = phone.replace(/\D/g, '');
    if (!raw) {
      setIsConnecting(false);
      toast({ title: "Informe o telefone", description: "Digite o número com DDD para conectar.", variant: "destructive" });
      return;
    }
    const phoneNumber = raw.length === 11 ? `+55${raw}` : `+${raw}`;

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      // Connect to WebSocket edge function with auth
      const wsUrl = `wss://euovvpwkwptwmnekaibm.supabase.co/functions/v1/whatsapp-qr?authorization=${encodeURIComponent(`Bearer ${session.access_token}`)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setWsStatus('connected');
        // Send user ID to initialize connection
        ws.send(JSON.stringify({ type: 'init', userId: user.id, phoneNumber }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received:", data);

        if (data.type === 'qr') {
          setQrCode(data.qr);
          setIsConnecting(false);
          toast({
            title: "QR Code gerado",
            description: "Escaneie o código com seu WhatsApp",
          });
        } else if (data.type === 'connected') {
          setQrCode(null);
          setIsConnecting(false);
          fetchConnection();
          toast({
            title: "WhatsApp conectado!",
            description: data.message,
          });
        } else if (data.type === 'error') {
          setIsConnecting(false);
          toast({
            title: "Erro",
            description: data.message,
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        setWsStatus('disconnected');
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao serviço",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setWsStatus('disconnected');
        setIsConnecting(false);
      };

    } catch (error) {
      console.error("Error connecting:", error);
      setIsConnecting(false);
      setWsStatus('disconnected');
      toast({
        title: "Erro",
        description: "Erro ao iniciar conexão",
        variant: "destructive",
      });
    }
  };

  const disconnectWhatsApp = async () => {
    if (wsRef.current) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        wsRef.current.send(JSON.stringify({ type: 'disconnect', userId: user.id }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setQrCode(null);
    setWsStatus('disconnected');
    fetchConnection();
    
    toast({
      title: "Desconectado",
      description: "WhatsApp desconectado com sucesso",
    });
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
            <CardContent className="space-y-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-4">
                {qrCode ? (
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p>Gerando QR Code...</p>
                      </>
                    ) : (
                      <>
                        <p>Clique em "Conectar WhatsApp" para gerar o QR Code</p>
                        <p className="text-sm mt-2">
                          Você precisará escanear o código com seu WhatsApp
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="Telefone com DDD (ex: 11999998888)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="flex gap-2">
                {!connection?.is_connected && wsStatus === 'disconnected' && (
                  <Button 
                    onClick={connectWhatsApp} 
                    disabled={isConnecting || !phone}
                    className="w-full"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                )}
                
                {(connection?.is_connected || wsStatus === 'connected') && (
                  <Button 
                    onClick={disconnectWhatsApp}
                    variant="destructive"
                    className="w-full"
                  >
                    <Unplug className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A integração WhatsApp usa WebSockets para comunicação em tempo real. O QR Code é gerado
            automaticamente e a conexão é estabelecida após escanear com seu WhatsApp.
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
