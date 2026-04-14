import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, CheckCircle2, AlertCircle, RefreshCw, Unplug, Smartphone, RotateCcw, Timer, Wifi, WifiOff, Zap } from "lucide-react";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import DashboardLayout from "@/components/DashboardLayout";
import { WhatsAppSchema } from "@/schemas/WhatsAppSchema";
import { TOKEN_COOKIE_KEY } from "@/constants/auth";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mascaraTelefone } from "@/utils/mask";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import confetti from "canvas-confetti";
import z from "zod";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface WhatsAppConnection {
  id: string;
  phone_number: string | null;
  is_connected: boolean;
  last_connected_at: string | null;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function WhatsAppContent() {
  const queryClient = useQueryClient();
  const [connection, setConnection]           = useState<WhatsAppConnection | null>(null);
  const [sseSessionId, setSseSessionId]       = useState<string | null>(null);
  const [qrCode, setQrCode]                   = useState<string | null>(null);
  const [sseError, setSseError]               = useState<string | null>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen]       = useState(false);
  const [syncConfirmationOpen, setSyncConfirmationOpen] = useState(false);
  const [formDataToConnect, setFormDataToConnect] = useState<z.infer<typeof WhatsAppSchema.create> | null>(null);
  const [qrSecondsLeft, setQrSecondsLeft]     = useState<number | null>(null);
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── queries ──────────────────────────────────────────────────────────────

  const { isLoading, refetch, isFetching } = useQuery<WhatsAppConnection>({
    queryKey: ["connectionWhatsApp"],
    queryFn: async () => {
      const result = await fetchUseQuery<undefined, WhatsAppConnection>({
        route: "/connect",
        method: "GET",
      });
      if (result) { setSseSessionId(result.id); setConnection(result); }
      return result;
    },
    retry: 2,
  });

  // ── form ─────────────────────────────────────────────────────────────────

  const schema = WhatsAppSchema.create;
  const formWhatsapp = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone_number: "" },
  });

  // ── mutations ─────────────────────────────────────────────────────────────

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) =>
      fetchUseQuery<typeof data, unknown>({ route: "/connect", method: "POST", data }),
    onSuccess: async (response: any) => {
      const connectionData = response.data || response;
      if (response?.qr) {
        setQrCode(response.qr);
        setConnection({
          id: connectionData.id,
          phone_number: connectionData.phone_number,
          is_connected: connectionData.is_connected,
          last_connected_at: connectionData.last_connected_at,
        });
        if (!sseSessionId) setSseSessionId(connectionData.id);
        startQrTimer();
        toast.info("Escaneie o QR Code para conectar o WhatsApp");
      }
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  const { mutate: mutateDisconnect, isPending: isPedingDisconnect } = useMutation({
    mutationFn: async () =>
      fetchUseQuery<undefined, unknown>({ route: `/disconnect/${sseSessionId}`, method: "PATCH" }),
    onSuccess: () => {
      toast.success("WhatsApp desconectado com sucesso! AGUARDE 5 MINUTOS PARA FAZER A CONEXÃO NOVAMENTE.");
      setConnection(null); setQrCode(null); setDisconnectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["connectionWhatsApp"] });
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  const { mutate: mutateReset, isPending: isResetting } = useMutation({
    mutationFn: async () => {
      if (!sseSessionId) return;
      await fetchUseQuery<undefined, unknown>({ route: `/disconnect/${sseSessionId}`, method: "PATCH" });
    },
    onSuccess: () => {
      setConnection(null); setQrCode(null); stopQrTimer();
      queryClient.invalidateQueries({ queryKey: ["connectionWhatsApp"] });
      toast.info("Conexão limpa. Agora você pode tentar novamente.");
    },
    onError: () => {
      setConnection(null); setQrCode(null); stopQrTimer();
      queryClient.invalidateQueries({ queryKey: ["connectionWhatsApp"] });
      toast.warning("Limpeza parcial. Tente conectar novamente.");
    },
  });

  // ── timer ─────────────────────────────────────────────────────────────────

  function startQrTimer() {
    stopQrTimer();
    setQrSecondsLeft(60);
    qrTimerRef.current = setInterval(() => {
      setQrSecondsLeft((s) => {
        if (s === null || s <= 1) { stopQrTimer(); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  function stopQrTimer() {
    if (qrTimerRef.current) { clearInterval(qrTimerRef.current); qrTimerRef.current = null; }
    setQrSecondsLeft(null);
  }

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleConnectClick = (data: z.infer<typeof schema>) => {
    setFormDataToConnect(data);
    setConnectModalOpen(true);
  };

  const confirmConnect = () => {
    if (formDataToConnect) { mutate(formDataToConnect); setConnectModalOpen(false); }
  };

  const handleQrExpired = () => {
    setQrCode(null); stopQrTimer(); mutateReset();
  };

  // ── effects ───────────────────────────────────────────────────────────────

  const playSuccessSound = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (connection?.is_connected) {
      if (qrCode) {
        playSuccessSound();
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 9999 });
      }
      setQrCode(null); stopQrTimer();
    }
  }, [connection?.is_connected, qrCode]);

  useEffect(() => () => stopQrTimer(), []);

  useEffect(() => {
    if (!connection?.id) return;
    setSseError(null);
    const token = Cookies.get(TOKEN_COOKIE_KEY);
    if (!token) { setSseError("Token não encontrado. Faça login novamente."); return; }

    const connectSSE = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_PUBLIC_API_URL}/events/${connection.id}`,
          { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" } }
        );
        if (!response.ok) { setSseError(`Erro ao conectar: ${response.status}`); return; }
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) { setSseError("Erro ao ler stream do servidor."); return; }
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                setConnection((prev) => prev ? { ...prev, ...data } : data);
                if (data?.is_connected) setQrCode(null);
              } catch { /* silent */ }
            }
          }
        }
      } catch { setSseError("Erro ao conectar ao servidor. Verifique sua conexão."); }
    };
    connectSSE();
  }, [sseSessionId]);

  // ── derived ───────────────────────────────────────────────────────────────

  const isConnected   = !!connection?.is_connected;
  const isStaleConn   = connection && !isConnected && !qrCode;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        .wa { font-family: 'DM Sans', sans-serif; color: #F0F5F2; display: flex; flex-direction: column; gap: 1.25rem; padding: 1.75rem; }

        /* section title */
        .wa-section { font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700; color: #C0D5CC; display: flex; align-items: center; gap: 6px; margin-bottom: 0.85rem; }
        .wa-section svg { width: 14px; height: 14px; color: #00C896; }

        /* status bar */
        .wa-status-bar {
          display: flex; align-items: center; justify-content: space-between;
          background: #111614; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 0.75rem 1rem;
        }
        .wa-status-left { display: flex; align-items: center; gap: 10px; }
        .wa-badge {
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 100px; padding: 4px 12px;
          font-size: 12px; font-weight: 700; font-family: 'Syne', sans-serif;
        }
        .wa-badge.on  { background: rgba(0,200,150,0.1); border: 1px solid rgba(0,200,150,0.25); color: #00C896; }
        .wa-badge.off { background: rgba(232,69,69,0.1); border: 1px solid rgba(232,69,69,0.2); color: #E84545; }
        .wa-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: waDot 2s infinite; }
        @keyframes waDot { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .wa-phone-info { font-size: 0.8rem; color: #7A9087; }
        .wa-phone-info strong { color: #C0D5CC; font-weight: 600; }

        /* alert banner */
        .wa-banner {
          display: flex; align-items: flex-start; gap: 10px;
          border-radius: 10px; padding: 0.85rem 1rem;
          font-size: 0.8rem; line-height: 1.6;
        }
        .wa-banner.warn  { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #D4A020; }
        .wa-banner.info  { background: rgba(0,200,150,0.06); border: 1px solid rgba(0,200,150,0.15); color: #7A9087; }
        .wa-banner.alert { background: rgba(245,166,35,0.07); border: 1px solid rgba(245,166,35,0.18); color: #B8900A; }
        .wa-banner svg   { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }
        .wa-banner strong { font-weight: 700; }

        /* main grid */
        .wa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        /* panel */
        .wa-panel {
          background: #111614; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 1.25rem;
        }

        /* qr area */
        .wa-qr-area {
          display: flex; gap: 1.25rem; align-items: flex-start;
        }
        .wa-qr-box {
          width: 130px; height: 130px; flex-shrink: 0;
          border-radius: 10px; background: #fff;
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          border: 2px solid rgba(0,200,150,0.2);
        }
        .wa-qr-box img { width: 110px; height: 110px; object-fit: contain; }
        .wa-qr-box.placeholder {
          background: #111614; border: 1px dashed rgba(255,255,255,0.1);
          flex-direction: column; gap: 6px;
          color: #3A5A50; font-size: 11px; text-align: center;
        }
        .wa-qr-countdown {
          position: absolute; bottom: 4px; right: 4px;
          font-size: 11px; font-weight: 700; border-radius: 100px;
          padding: 2px 7px; background: rgba(0,0,0,0.7); color: #fff;
        }
        .wa-qr-countdown.urgent { background: #E84545; }

        .wa-steps { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
        .wa-step  { display: flex; align-items: flex-start; gap: 8px; font-size: 0.78rem; color: #5A7A70; line-height: 1.55; }
        .wa-step-num {
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(0,200,150,0.1); border: 1px solid rgba(0,200,150,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.58rem; font-weight: 800; color: #00C896;
          font-family: 'Syne', sans-serif; flex-shrink: 0; margin-top: 1px;
        }

        /* form */
        .wa-form-label { font-size: 0.78rem; font-weight: 500; color: #7A9087; margin-bottom: 0.35rem; display: block; }
        .wa-form-hint  { font-size: 0.7rem; color: #3A5A50; margin-top: 0.25rem; }
        .wa-input {
          width: 100%; background: #0D1210 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important; color: #F0F5F2 !important;
          font-size: 0.875rem !important; height: 40px !important;
          font-family: 'DM Sans', sans-serif !important;
          transition: border-color 0.2s !important;
        }
        .wa-input:focus { border-color: rgba(0,200,150,0.4) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; }
        .wa-input::placeholder { color: #2A4A40 !important; }
        .wa-input:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

        /* buttons */
        .wa-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: #00C896; color: #051A12; border: none;
          border-radius: 8px; padding: 0.65rem 1.1rem;
          font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          width: 100%; justify-content: center;
        }
        .wa-btn-primary:hover:not(:disabled) { background: #00A87E; transform: translateY(-1px); }
        .wa-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .wa-btn-danger {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(232,69,69,0.1); color: #E84545;
          border: 1px solid rgba(232,69,69,0.25); border-radius: 8px;
          padding: 0.6rem 1.1rem; font-family: 'Syne', sans-serif;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          transition: background 0.2s; width: 100%; justify-content: center;
        }
        .wa-btn-danger:hover:not(:disabled) { background: rgba(232,69,69,0.18); }
        .wa-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: #5A7A70;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
          padding: 0.55rem 1rem; font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem; font-weight: 500; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .wa-btn-ghost:hover { border-color: rgba(0,200,150,0.2); color: #C0D5CC; }
        .wa-btn-warn {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(245,158,11,0.08); color: #D4A020;
          border: 1px solid rgba(245,158,11,0.25); border-radius: 8px;
          padding: 0.5rem 0.9rem; font-size: 0.78rem; font-weight: 600;
          font-family: 'Syne', sans-serif; cursor: pointer;
          transition: background 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .wa-btn-warn:hover:not(:disabled) { background: rgba(245,158,11,0.15); }

        /* how it works */
        .wa-how { display: flex; flex-direction: column; gap: 0; }
        .wa-how-step {
          display: flex; gap: 12px; padding: 0.85rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .wa-how-step:last-child { border-bottom: none; }
        .wa-how-num {
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(0,200,150,0.1); border: 1px solid rgba(0,200,150,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.68rem; font-weight: 800; color: #00C896;
          font-family: 'Syne', sans-serif; flex-shrink: 0; margin-top: 1px;
        }
        .wa-how-title { font-size: 0.82rem; font-weight: 600; color: #C0D5CC; margin-bottom: 2px; }
        .wa-how-desc  { font-size: 0.76rem; color: #4A6A60; line-height: 1.55; }

        /* divider */
        .wa-divider { height: 1px; background: rgba(255,255,255,0.05); }

        /* refresh btn */
        .wa-refresh {
          background: none; border: none; cursor: pointer;
          color: #3A5A50; padding: 4px; border-radius: 6px;
          display: inline-flex; align-items: center; transition: color 0.15s;
        }
        .wa-refresh:hover { color: #00C896; }
        .wa-refresh svg { width: 13px; height: 13px; }
        .wa-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* dialog override */
        .wa-dialog-inner { background: #0D1210 !important; border: 1px solid rgba(255,255,255,0.07) !important; border-radius: 16px !important; }
        .wa-dialog-title { font-family: 'Syne', sans-serif !important; color: #F0F5F2 !important; font-weight: 800 !important; }
        .wa-dialog-desc  { color: #5A7A70 !important; font-size: 0.82rem !important; }

        /* connected state */
        .wa-connected-info {
          display: flex; flex-direction: column; gap: 10px;
        }
        .wa-connected-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.7rem 0.85rem; background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 9px;
        }
        .wa-connected-label { font-size: 0.72rem; color: #4A6A60; font-weight: 500; }
        .wa-connected-value { font-size: 0.82rem; color: #C0D5CC; font-weight: 600; }

        @media (max-width: 700px) {
          .wa-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wa">

        {/* ── STATUS BAR ── */}
        <div className="wa-status-bar">
          <div className="wa-status-left">
            <span className={`wa-badge ${isConnected ? "on" : "off"}`}>
              <span className="wa-dot" />
              {isConnected ? "Conectado" : "Desconectado"}
            </span>
            {isConnected && connection?.phone_number && (
              <span className="wa-phone-info">
                <strong>{connection.phone_number}</strong>
              </span>
            )}
            {!isConnected && !qrCode && (
              <span className="wa-phone-info">Nenhum número vinculado</span>
            )}
          </div>
          <button className="wa-refresh" onClick={() => refetch()} title="Atualizar status">
            <RefreshCw className={isFetching ? "wa-spin" : ""} />
          </button>
        </div>

        {/* ── STALE CONNECTION BANNER ── */}
        {isStaleConn && (
          <div className="wa-banner warn">
            <AlertCircle />
            <div style={{ flex: 1 }}>
              Existe uma conexão anterior não concluída
              {connection?.phone_number && <> (número: <strong>{connection.phone_number}</strong>)</>}.
              Limpe antes de tentar novamente.
            </div>
            <ButtonLoading
              className="wa-btn-warn"
              isLoading={isResetting}
              onClick={() => mutateReset()}
            >
              <RotateCcw size={12} /> Limpar
            </ButtonLoading>
          </div>
        )}

        {/* ── MAIN GRID ── */}
        <div className="wa-grid">

          {/* LEFT: QR + FORM */}
          <div className="wa-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="wa-section">
              <MessageCircle />
              {isConnected ? "Conexão ativa" : "Conectar WhatsApp"}
            </div>

            {/* QR area */}
            <div className="wa-qr-area">
              <div className={`wa-qr-box${!qrCode && !isConnected ? " placeholder" : ""}`}>
                {isPending && (
                  <RefreshCw size={22} style={{ color: "#3A5A50", animation: "spin 1s linear infinite" }} />
                )}
                {qrCode && !isPending && (
                  <>
                    <img src={qrCode} alt="WhatsApp QR Code" />
                    {qrSecondsLeft !== null && (
                      <span className={`wa-qr-countdown${qrSecondsLeft <= 15 ? " urgent" : ""}`}>
                        {qrSecondsLeft}s
                      </span>
                    )}
                  </>
                )}
                {isConnected && !qrCode && (
                  <CheckCircle2 size={40} style={{ color: "#00C896" }} />
                )}
                {!qrCode && !isConnected && !isPending && (
                  <>
                    <MessageCircle size={28} style={{ color: "#3A5A50" }} />
                    <span>Aguardando</span>
                  </>
                )}
              </div>

              <div className="wa-steps">
                {isConnected ? (
                  <>
                    <div style={{ fontSize: "0.82rem", color: "#00C896", fontWeight: 600, fontFamily: "'Syne', sans-serif" }}>
                      WhatsApp vinculado com sucesso!
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#4A6A60", lineHeight: 1.6 }}>
                      Suas cobranças serão enviadas automaticamente nos dias configurados.
                    </div>
                  </>
                ) : qrCode ? (
                  <>
                    <div style={{ fontSize: "0.8rem", color: "#C0D5CC", fontWeight: 600 }}>Escaneie o código</div>
                    <div className="wa-step"><div className="wa-step-num">1</div><span>Abra o WhatsApp no celular</span></div>
                    <div className="wa-step"><div className="wa-step-num">2</div><span>Vá em Configurações → Aparelhos vinculados</span></div>
                    <div className="wa-step"><div className="wa-step-num">3</div><span>Toque em "Vincular aparelho" e escaneie</span></div>
                  </>
                ) : (
                  <>
                    <div className="wa-step"><div className="wa-step-num">1</div><span>Digite seu número de WhatsApp abaixo</span></div>
                    <div className="wa-step"><div className="wa-step-num">2</div><span>Clique em Conectar para gerar o QR Code</span></div>
                    <div className="wa-step"><div className="wa-step-num">3</div><span>Escaneie com o WhatsApp do celular</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Form */}
            {!isConnected && (
              <Form {...formWhatsapp}>
                <form style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  onSubmit={formWhatsapp.handleSubmit((data) => mutate(data))}>
                  <FormField
                    control={formWhatsapp.control}
                    name="phone_number"
                    disabled={isConnected}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="wa-form-label">
                          Número de WhatsApp
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="wa-input"
                            placeholder="(00) 00000-0000"
                            {...field}
                            value={mascaraTelefone(field.value)}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                          />
                        </FormControl>
                        <div className="wa-form-hint">Somente números, com DDD e 9 antes</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ButtonLoading
                    className="wa-btn-primary"
                    isLoading={isPending}
                    onClick={formWhatsapp.handleSubmit(handleConnectClick)}
                    type="button"
                  >
                    <MessageCircle size={14} />
                    Conectar WhatsApp
                  </ButtonLoading>
                </form>
              </Form>
            )}

            {/* Disconnect */}
            {isConnected && (
              <ButtonLoading
                className="wa-btn-danger"
                isLoading={isPedingDisconnect}
                onClick={() => setDisconnectModalOpen(true)}
              >
                <Unplug size={14} />
                Desconectar WhatsApp
              </ButtonLoading>
            )}
          </div>

          {/* RIGHT: info panels */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Connection details (when connected) */}
            {isConnected && (
              <div className="wa-panel">
                <div className="wa-section"><Wifi />Detalhes da conexão</div>
                <div className="wa-connected-info">
                  <div className="wa-connected-row">
                    <span className="wa-connected-label">Número</span>
                    <span className="wa-connected-value">{connection?.phone_number || "—"}</span>
                  </div>
                  {connection?.last_connected_at && (
                    <div className="wa-connected-row">
                      <span className="wa-connected-label">Última conexão</span>
                      <span className="wa-connected-value">
                        {new Date(connection.last_connected_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                  <div className="wa-connected-row">
                    <span className="wa-connected-label">Status</span>
                    <span style={{ fontSize: "0.82rem", color: "#00C896", fontWeight: 700 }}>● Ativo</span>
                  </div>
                </div>
              </div>
            )}

            {/* SSE error */}
            {sseError && (
              <div className="wa-banner warn">
                <AlertCircle />
                <span>{sseError}</span>
              </div>
            )}

            {/* Important alert */}
            <div className="wa-banner alert">
              <Smartphone />
              <span>
                <strong>Importante:</strong> Mantenha seu celular conectado à internet no dia dos disparos para garantir o envio das cobranças.
              </span>
            </div>

            {/* How it works */}
            <div className="wa-panel">
              <div className="wa-section"><Zap />Como funciona</div>
              <div className="wa-how">
                {[
                  { title: "Conecte seu WhatsApp", desc: "Escaneie o QR Code para estabelecer a conexão com o sistema." },
                  { title: "Configure templates", desc: "Crie templates de mensagem personalizados para suas cobranças." },
                  { title: "Automatize os envios", desc: "Ative a cobrança automática nos clientes e as mensagens serão enviadas no prazo." },
                ].map((s, i) => (
                  <div key={i} className="wa-how-step">
                    <div className="wa-how-num">{i + 1}</div>
                    <div>
                      <div className="wa-how-title">{s.title}</div>
                      <div className="wa-how-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info banner */}
            <div className="wa-banner info">
              <AlertCircle />
              <span>
                A integração usa SSE para comunicação em tempo real. O QR Code é gerado automaticamente e expira em 60 segundos.
              </span>
            </div>
          </div>
        </div>

        {/* ── DIALOGS ── */}

        {/* Disconnect confirm */}
        <Dialog open={disconnectModalOpen} onOpenChange={setDisconnectModalOpen}>
          <DialogContent style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, maxWidth: 420 }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Syne', sans-serif", color: "#F0F5F2", display: "flex", alignItems: "center", gap: 8 }}>
                <WifiOff size={16} color="#E84545" /> Desconectar WhatsApp
              </DialogTitle>
              <DialogDescription style={{ color: "#5A7A70", fontSize: "0.82rem" }}>
                Tem certeza? Você precisará escanear o QR Code novamente para reconectar e deve aguardar pelo menos <strong style={{ color: "#C0D5CC" }}>5 minutos</strong>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter style={{ gap: 8 }}>
              <button className="wa-btn-ghost" onClick={() => setDisconnectModalOpen(false)}>Cancelar</button>
              <ButtonLoading className="wa-btn-danger" style={{ width: "auto" }} isLoading={isPedingDisconnect} onClick={() => mutateDisconnect()}>
                Sim, desconectar
              </ButtonLoading>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Connect confirm */}
        <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
          <DialogContent style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, maxWidth: 440 }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Syne', sans-serif", color: "#F0F5F2" }}>
                Confirmar conexão
              </DialogTitle>
              <DialogDescription style={{ color: "#5A7A70", fontSize: "0.82rem" }}>
                Verifique as informações antes de prosseguir.
              </DialogDescription>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0 12px" }}>
              {[
                "Confira se o número de WhatsApp está correto.",
                "Após escanear o QR Code, aguarde a sincronização (leva em média 1 minuto).",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: "0.8rem", color: "#7A9087" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#00C896", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ lineHeight: 1.6 }}>{t}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, fontSize: "0.8rem", color: "#7A9087" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#00C896", flexShrink: 0, marginTop: 1 }}>3</div>
                <span style={{ lineHeight: 1.6 }}>
                  Se tiver problemas, consulte a <Link to="/help" style={{ color: "#00C896", fontWeight: 600 }}>Central de Ajuda</Link>.
                </span>
              </div>
            </div>
            <DialogFooter style={{ gap: 8 }}>
              <button className="wa-btn-ghost" onClick={() => setConnectModalOpen(false)}>Cancelar</button>
              <button className="wa-btn-primary" style={{ width: "auto", padding: "0.6rem 1.25rem" }} onClick={confirmConnect}>
                Confirmar e gerar QR Code
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Modal */}
        <Dialog open={!!qrCode || qrSecondsLeft === 0} onOpenChange={() => {}}>
          <DialogContent
            style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, maxWidth: 380 }}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Syne', sans-serif", color: "#F0F5F2" }}>
                Conectar WhatsApp
              </DialogTitle>
              <DialogDescription style={{ color: "#5A7A70", fontSize: "0.82rem" }}>
                Escaneie o código com o seu WhatsApp para conectar.
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "0.5rem 0" }}>
              {qrSecondsLeft === 0 ? (
                <div style={{ width: 200, height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#111614", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}>
                  <Timer size={32} style={{ color: "#3A5A50" }} />
                  <p style={{ fontSize: 13, color: "#3A5A50", textAlign: "center", margin: 0 }}>QR Code expirado</p>
                  <ButtonLoading className="wa-btn-primary" style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.78rem" }} isLoading={isResetting} onClick={handleQrExpired}>
                    Gerar novo QR
                  </ButtonLoading>
                </div>
              ) : (
                <>
                  {qrCode && (
                    <div style={{ position: "relative" }}>
                      <div style={{ background: "#fff", borderRadius: 12, padding: 8, border: "2px solid rgba(0,200,150,0.3)" }}>
                        <img src={qrCode} alt="QR Code" style={{ width: 190, height: 190, display: "block", objectFit: "contain" }} />
                      </div>
                      {qrSecondsLeft !== null && (
                        <div style={{
                          position: "absolute", bottom: 8, right: 8,
                          fontSize: 11, fontWeight: 700, borderRadius: 100,
                          padding: "2px 8px",
                          background: qrSecondsLeft <= 15 ? "#E84545" : "rgba(0,0,0,0.7)",
                          color: "#fff",
                        }}>
                          {qrSecondsLeft}s
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "#7A9087", margin: "0 0 4px" }}>
                      Faça a leitura e aguarde a sincronização...
                    </p>
                    <p style={{ fontSize: 12, color: "#E84545", fontWeight: 700, margin: 0 }}>
                      Não feche esta janela durante a sincronização.
                    </p>
                  </div>
                </>
              )}
            </div>

            {qrSecondsLeft !== 0 && (
              <DialogFooter>
                <button className="wa-btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => setSyncConfirmationOpen(true)}>
                  Sincronização concluída
                </button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        {/* Sync confirm */}
        <Dialog open={syncConfirmationOpen} onOpenChange={setSyncConfirmationOpen}>
          <DialogContent style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, maxWidth: 440 }}>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Syne', sans-serif", color: "#F0F5F2" }}>
                Confirme a sincronização
              </DialogTitle>
              <DialogDescription style={{ color: "#5A7A70", fontSize: "0.82rem" }}>
                Verifique o status no seu WhatsApp antes de continuar.
              </DialogDescription>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0 12px" }}>
              <p style={{ fontSize: "0.8rem", color: "#7A9087", lineHeight: 1.65 }}>
                No celular, vá em <strong style={{ color: "#C0D5CC" }}>Aparelhos Conectados</strong>. O status deve ter mudado de{" "}
                <span style={{ color: "#F5A623", fontWeight: 700 }}>"Sincronizando..."</span> para{" "}
                <span style={{ color: "#00C896", fontWeight: 700 }}>"Ativo"</span>.
              </p>
              <div className="wa-banner warn">
                <AlertCircle />
                <span>Se ainda estiver "Sincronizando", <strong>aguarde!</strong> Confirmar antes pode causar falha na conexão.</span>
              </div>
            </div>
            <DialogFooter style={{ gap: 8, flexWrap: "wrap" }}>
              <button className="wa-btn-ghost" onClick={() => setSyncConfirmationOpen(false)}>
                Ainda está sincronizando
              </button>
              <button className="wa-btn-primary" style={{ width: "auto", padding: "0.6rem 1.1rem" }}
                onClick={() => { setSyncConfirmationOpen(false); setQrCode(null); window.location.reload(); }}>
                Sim, já concluiu
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}

export default function WhatsApp() {
  return (
    <DashboardLayout>
      <WhatsAppContent />
    </DashboardLayout>
  );
}