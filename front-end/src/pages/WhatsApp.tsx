import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, CheckCircle2, AlertCircle, RefreshCw, Unplug } from "lucide-react";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/DashboardLayout";
import { WhatsAppSchema } from "@/schemas/WhatsAppSchema";
import { TOKEN_COOKIE_KEY } from "@/constants/auth";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { mascaraTelefone } from "@/utils/mask";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import z from "zod";

interface WhatsAppConnection {
  id: string;
  phone_number: string | null;
  is_connected: boolean;
  last_connected_at: string | null;
}

export default function WhatsApp() {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [sseSessionId, setSseSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sseError, setSseError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<WhatsAppConnection>({
    queryKey: ["connectionWhatsApp"],
    queryFn: async () => {
      const result = await fetchUseQuery<undefined, WhatsAppConnection>({
        route: "/connect",
        method: "GET",
      });
      if (result) {
        setSseSessionId(result.id);
        setConnection(result);
      }
      return result;
    },
    retry: 2,
  });

  const schema = WhatsAppSchema.create;

  const formWhatsapp = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone_number: "",
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, unknown>({
        route: "/connect",
        method: "POST",
        data,
      });
    },

    onSuccess: async (response: any) => {
      // Verifica se o backend retornou QR e se retornou os dados de conexão em 'data'
      const connectionData = response.data || response;

      if (response?.qr) {
        setQrCode(response.qr);
        // Garante que apenas os dados da conexão (sem o QR) sejam passados para setConnection
        setConnection({
          id: connectionData.id,
          phone_number: connectionData.phone_number,
          is_connected: connectionData.is_connected,
          last_connected_at: connectionData.last_connected_at,
        });

        if (!sseSessionId) setSseSessionId(connectionData.id);

        toast.info("Escaneie o QR Code para conectar o WhatsApp");
        return;
      }

    },

    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  const { mutate: mutateDisconnect, isPending: isPedingDisconnect } = useMutation({
    mutationFn: async () => {
      return await fetchUseQuery<undefined, unknown>({
        route: `/disconnect/${sseSessionId}`,
        method: "PATCH",
      });
    },

    onSuccess: () => {
      toast.success("WhatsApp desconectado com sucesso!");
      setConnection(null);
      setQrCode(null);
    },

    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  useEffect(() => {
    if (!connection?.id) return;

    console.log("🔌 Iniciando SSE para sessionId:", connection?.id);
    setSseError(null);

    const token = Cookies.get(TOKEN_COOKIE_KEY);
    if (!token) {
      setSseError("Token não encontrado. Faça login novamente.");
      return;
    }

    const connectSSE = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/events/${connection.id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'text/event-stream',
            },
          }
        );

        if (!response.ok) {
          console.error('❌ SSE response error:', response.status, response.statusText);
          setSseError(`Erro ao conectar: ${response.status} ${response.statusText}`);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          setSseError("Erro ao ler stream do servidor.");
          return;
        }

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("🔌 SSE stream finalizado");
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("DADOS RECEBIDOS DO SSE: ", data);

                setConnection(prevConnection => {
                  if (prevConnection) {
                    return {
                      ...prevConnection,
                      ...data
                    };
                  }
                  return data;
                });

                if (data?.is_connected) {
                  setQrCode(null);
                }
              } catch (e) {
                console.error("❌ Erro ao parsear SSE data:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ SSE fetch error:", error);
        setSseError("Erro ao conectar ao servidor. Verifique sua conexão.");
      }
    };
    connectSSE();

    return () => {
      console.log("🔌 SSE desconectado");
    };
  }, [sseSessionId]);

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
          {sseError && (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sseError}</AlertDescription>
            </Alert>
          )}
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

              {connection?.is_connected && (
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
                    {isPending ? (
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

              <Form {...formWhatsapp}>
                <form className="space-y-2" onSubmit={formWhatsapp.handleSubmit((data) => mutate(data))}>

                  <FormField
                    control={formWhatsapp.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone <span className="text-red-600">*</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o telefone"
                            {...field}
                            value={mascaraTelefone(field.value)}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))} // Limpa para enviar
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* <div className="flex flex-row justify-between">
                    <ButtonLoading className="w-full" isLoading={isPending} type="submit" >
                      <MessageCircle className="w-4 h-4 mr-2" /> Conectar WhatsApp
                    </ButtonLoading>
                  </div> */}
                </form>
              </Form>

              <div className="flex gap-2">
                {!connection?.is_connected && (
                  <ButtonLoading
                    className="w-full"
                    isLoading={isPending}
                    onClick={formWhatsapp.handleSubmit((data) => mutate(data))}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Conectar WhatsApp
                  </ButtonLoading>
                )}

                {connection?.is_connected && (
                  <ButtonLoading
                    className="w-full"
                    variant="destructive"
                    isLoading={isPedingDisconnect}
                    onClick={() => mutateDisconnect()}
                  >
                    <Unplug className="w-4 h-4 mr-2" />
                    Desconectar
                  </ButtonLoading>
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