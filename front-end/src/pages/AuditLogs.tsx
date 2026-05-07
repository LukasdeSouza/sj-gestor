import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Cookies from "js-cookie";
import { AuthUser } from "@/api/models/auth";
import {
  History, MessageCircle, Send, CheckCircle2, AlertCircle,
  Filter, X, Calendar, Search
} from "lucide-react";

type CommunicationLog = {
  id: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  error?: string | null;
  sent_at: string;
  client_id?: string | null;
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function AuditLogs() {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [searchRecipient, setSearchRecipient] = useState("");

  // Build query params
  const params = new URLSearchParams();
  if (channel) params.append("channel", channel);
  if (status) params.append("status", status);
  if (dateStart) params.append("date_start", dateStart);
  if (dateEnd) params.append("date_end", dateEnd);
  params.append("limit", "200");

  const { data: logs, isLoading, refetch } = useQuery<CommunicationLog[]>({
    queryKey: ["allCommunicationLogs", parsedUser?.id, channel, status, dateStart, dateEnd],
    queryFn: async () => fetchUseQuery<undefined, CommunicationLog[]>({
      route: `/communication-logs?${params.toString()}`,
      method: "GET",
    }),
    enabled: !!parsedUser?.id,
    refetchOnWindowFocus: false,
  });

  const hasFilters = !!channel || !!status || !!dateStart || !!dateEnd || !!searchRecipient;

  const filteredLogs = (logs ?? []).filter((log) => {
    if (!searchRecipient) return true;
    return log.recipient.toLowerCase().includes(searchRecipient.toLowerCase());
  });

  const totalSent = filteredLogs.filter((l) => l.status === "sent").length;
  const totalFailed = filteredLogs.filter((l) => l.status === "failed").length;
  const totalWpp = filteredLogs.filter((l) => l.channel === "whatsapp").length;
  const totalEmail = filteredLogs.filter((l) => l.channel === "email").length;

  const clearFilters = () => {
    setChannel("");
    setStatus("");
    setDateStart("");
    setDateEnd("");
    setSearchRecipient("");
  };

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        .al-filter-btn { cursor: pointer; transition: all 0.15s; }
        .al-filter-btn:hover { border-color: rgba(0,200,150,0.4) !important; color: #00C896 !important; }
        .al-row { transition: background 0.12s; }
        .al-row:hover { background: #F8FAFC !important; }
        .al-input:focus { outline: none; border-color: rgba(0,200,150,0.4) !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Montserrat', sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 3px", letterSpacing: -0.6, color: "#0F172A" }}>
              Auditoria de Disparos
            </h1>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
              Histórico completo de mensagens enviadas pelo sistema
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Total de disparos", value: filteredLogs.length, color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: <History size={15} color="#6366f1" /> },
            { label: "Enviados com sucesso", value: totalSent, color: "#00C896", bg: "rgba(0,200,150,0.1)", icon: <CheckCircle2 size={15} color="#00C896" /> },
            { label: "Falharam", value: totalFailed, color: "#E84545", bg: "rgba(232,69,69,0.1)", icon: <AlertCircle size={15} color="#E84545" /> },
            { label: "Via WhatsApp", value: totalWpp, color: "#25D366", bg: "rgba(37,211,102,0.1)", icon: <MessageCircle size={15} color="#25D366" /> },
          ].map((card) => (
            <div key={card.label} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>{card.label}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: card.color, letterSpacing: -0.5, lineHeight: 1 }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Filter size={14} color="#64748B" />

            {/* Busca por destinatário */}
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                className="al-input"
                style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px 7px 28px", fontSize: 12, color: "#0F172A" }}
                placeholder="Buscar por telefone ou e-mail..."
                value={searchRecipient}
                onChange={(e) => setSearchRecipient(e.target.value)}
              />
            </div>

            {/* Canal */}
            <select
              className="al-input"
              style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#0F172A", background: "#FFF" }}
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="">Todos os canais</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">E-mail</option>
            </select>

            {/* Status */}
            <select
              className="al-input"
              style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#0F172A", background: "#FFF" }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="sent">Enviados</option>
              <option value="failed">Falhas</option>
            </select>

            {/* Data início */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 10px" }}>
              <Calendar size={13} color="#94A3B8" />
              <input
                type="date"
                className="al-input"
                style={{ border: "none", fontSize: 12, color: "#0F172A", background: "transparent" }}
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>

            <span style={{ fontSize: 12, color: "#94A3B8" }}>até</span>

            {/* Data fim */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #E2E8F0", borderRadius: 8, padding: "5px 10px" }}>
              <Calendar size={13} color="#94A3B8" />
              <input
                type="date"
                className="al-input"
                style={{ border: "none", fontSize: 12, color: "#0F172A", background: "transparent" }}
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>

            {hasFilters && (
              <button
                className="al-filter-btn"
                style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid rgba(232,69,69,0.2)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#E84545", background: "rgba(232,69,69,0.05)", cursor: "pointer" }}
                onClick={clearFilters}
              >
                <X size={12} /> Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tabela / Lista */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>

          {/* Header da Tabela */}
          <div style={{ display: "grid", gridTemplateColumns: "36px 90px 100px 1fr 140px 90px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
            {["", "Canal", "Status", "Mensagem", "Destinatário", "Data/Hora"].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#64748B" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B" }}>Carregando logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748B" }}>
              <History size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 13, margin: 0 }}>Nenhum disparo encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div>
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="al-row"
                  style={{ display: "grid", gridTemplateColumns: "36px 90px 100px 1fr 140px 90px", gap: 12, padding: "12px 20px", borderBottom: "1px solid #F8FAFC", alignItems: "center" }}
                >
                  {/* Ícone do canal */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: log.status === 'sent' ? "rgba(0,200,150,0.1)" : "rgba(232,69,69,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${log.status === 'sent' ? "rgba(0,200,150,0.2)" : "rgba(232,69,69,0.15)"}`,
                  }}>
                    {log.channel === 'whatsapp'
                      ? <MessageCircle size={13} color={log.status === 'sent' ? "#00C896" : "#E84545"} />
                      : <Send size={13} color={log.status === 'sent' ? "#00C896" : "#E84545"} />
                    }
                  </div>

                  {/* Canal */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                    {log.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                  </span>

                  {/* Status */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 100, display: "inline-block",
                    background: log.status === 'sent' ? "rgba(0,200,150,0.1)" : "rgba(232,69,69,0.1)",
                    color: log.status === 'sent' ? "#00C896" : "#E84545",
                    border: `1px solid ${log.status === 'sent' ? "rgba(0,200,150,0.2)" : "rgba(232,69,69,0.2)"}`,
                  }}>
                    {log.status === 'sent' ? '✓ ENVIADO' : '✗ FALHOU'}
                  </span>

                  {/* Mensagem */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {log.message}
                    </div>
                    {log.error && (
                      <div style={{ fontSize: 11, color: "#E84545", marginTop: 2 }}>
                        ⚠ {log.error}
                      </div>
                    )}
                  </div>

                  {/* Destinatário */}
                  <span style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {log.recipient}
                  </span>

                  {/* Data/Hora */}
                  <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                    {formatDateTime(log.sent_at)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {filteredLogs.length > 0 && (
            <div style={{ padding: "10px 20px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {filteredLogs.length} registro{filteredLogs.length !== 1 ? "s" : ""} encontrado{filteredLogs.length !== 1 ? "s" : ""}
                {" · "}{totalSent} enviado{totalSent !== 1 ? "s" : ""}{" · "}{totalFailed} falha{totalFailed !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
