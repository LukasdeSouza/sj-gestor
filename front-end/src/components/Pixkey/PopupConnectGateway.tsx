import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AuthUser } from "@/api/models/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import Cookies from "js-cookie";
import { Loader2, Link as LinkIcon, Info } from "lucide-react";

interface Props {
  gatewayName: string;
  gatewayLabel: string;
  children: React.ReactNode;
  instructionsUrl?: string;
  onSuccess?: () => void;
}

export function PopupConnectGateway({ gatewayName, gatewayLabel, children, instructionsUrl, onSuccess }: Props) {
  const user = Cookies.get("user");
  const parsedUser: AuthUser | null = user ? JSON.parse(user) : null;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!parsedUser?.id) throw new Error("Usuário não encontrado.");
      return await fetchUseQuery({
        route: `/users/${parsedUser.id}/gateways`,
        method: "POST",
        data: {
          gateway_name: gatewayName,
          api_key: apiKey
        },
      });
    },
    onSuccess: () => {
      toast.success(`${gatewayLabel} conectado com sucesso!`);
      setOpen(false);
      setApiKey("");
      qc.invalidateQueries({ queryKey: ["userGateways", parsedUser?.id] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || `Erro ao conectar ${gatewayLabel}. Verifique suas credenciais.`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setApiKey("");
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-0 overflow-hidden" style={{ background: "var(--bg2, #FFFFFF)", border: "1px solid var(--border, #E2E8F0)", borderRadius: "24px" }}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text, #0F172A)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            Conectar {gatewayLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2">
          <p style={{ color: "var(--text2, #334155)", fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Insira o seu <strong>Access Token (Chave de API)</strong> do {gatewayLabel} para permitir que o sistema gere cobranças automaticamente em seu nome.
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text2, #334155)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              Access Token / Chave API
            </label>
            <Input 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ex: APP_USR-123456789..."
              style={{ background: "var(--bg, #F8FAFC)", borderColor: "var(--border, #E2E8F0)", color: "var(--text, #0F172A)", fontFamily: "monospace", fontSize: "0.85rem" }}
            />
          </div>

          {instructionsUrl && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "1.5rem",
              background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 12, padding: "12px",
            }}>
              <Info size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text, #0F172A)", margin: "0 0 4px", fontWeight: 700 }}>Não sabe onde achar sua chave?</p>
                <a href={instructionsUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#3b82f6", textDecoration: "underline", display: "flex", alignItems: "center", gap: 4 }}>
                  Ver tutorial passo a passo <LinkIcon size={12} />
                </a>
              </div>
            </div>
          )}

          <Button 
            onClick={() => mutate()} 
            disabled={isPending || !apiKey.trim()}
            style={{ width: "100%", background: "var(--cobr, #00C896)", color: "#fff", fontWeight: 800, borderRadius: "10px", padding: "1rem", height: "auto" }}
          >
            {isPending ? <Loader2 className="animate-spin" size={20} /> : "Conectar Agora"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
