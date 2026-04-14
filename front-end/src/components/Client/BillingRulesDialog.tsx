import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Settings, Plus, Trash2 } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface RuleStep {
  days_offset: number;
  type: string;
  subject: string;
  content: string;
}

interface Niche {
  id: string;
  name: string;
  icon: string;
  templates: { id: string; type: string; days_offset: number; subject: string; content: string }[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getTypeFromOffset(offset: number) {
  if (offset < 0) return "pre_vencimento";
  if (offset === 0) return "vencimento";
  return "pos_vencimento";
}

function getDefaultSubject(offset: number) {
  if (offset < 0) return "Lembrete de pagamento - {nome}";
  if (offset === 0) return "Pagamento hoje - {nome}";
  return "Pagamento em atraso - {nome}";
}

function getDefaultContent(offset: number) {
  if (offset < 0)
    return "Olá, {nome}! 👋\n\nSeu pagamento de {valor} vence em {vencimento}.\n\n💳 Pix: {chave_pix}\n\nQualquer dúvida, estamos à disposição!";
  if (offset === 0)
    return "Olá, {nome}! 📅\n\nHoje é dia de pagamento!\n\nValor: {valor}\n🔑 Chave Pix: {chave_pix}\n\nSe já pagou, pode ignorar esta mensagem.";
  return "Olá, {nome}! ⚠️\n\nSeu pagamento de {valor} (vencimento: {vencimento}) está em atraso.\n\n🔑 Chave Pix: {chave_pix}\n\nApós o pagamento, envie o comprovante.";
}

const DEFAULT_STEPS: RuleStep[] = [
  { days_offset: -3, type: "pre_vencimento", subject: "Lembrete de pagamento - {nome}", content: getDefaultContent(-3) },
  { days_offset:  0, type: "vencimento",      subject: "Pagamento hoje - {nome}",        content: getDefaultContent(0)  },
  { days_offset:  3, type: "pos_vencimento",  subject: "Pagamento em atraso - {nome}",   content: getDefaultContent(3)  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface Props {
  clientId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BillingRulesDialog({ clientId, open, onClose, onSuccess }: Props) {
  const [steps, setSteps]               = useState<RuleStep[]>([...DEFAULT_STEPS]);
  const [editingIdx, setEditingIdx]     = useState<number | null>(null);
  const [saving, setSaving]             = useState(false);
  const [niches, setNiches]             = useState<Niche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [loadingNiches, setLoadingNiches] = useState(false);
  const [recurrence, setRecurrence]     = useState<"none" | "monthly">("none");

  useEffect(() => {
    if (open) {
      setSteps([...DEFAULT_STEPS]);
      setEditingIdx(null);
      setSelectedNiche(null);
      setRecurrence("none");
      loadNiches();
    }
  }, [open]);

  async function loadNiches() {
    setLoadingNiches(true);
    try {
      const res = await fetchUseQuery<undefined, { data: Niche[] }>({ route: "/niches", method: "GET" });
      if (res?.data) setNiches(res.data);
    } catch { /* nichos são opcionais */ }
    finally { setLoadingNiches(false); }
  }

  function applyNiche(niche: Niche) {
    setSelectedNiche(niche);
    const nicheSteps: RuleStep[] = niche.templates
      .map(t => ({ days_offset: t.days_offset, type: t.type, subject: t.subject, content: t.content }))
      .sort((a, b) => a.days_offset - b.days_offset);
    setSteps(nicheSteps);
    toast.success(`Templates de "${niche.name}" aplicados!`);
  }

  function addStep() {
    const maxOffset = steps.length > 0 ? Math.max(...steps.map(s => s.days_offset)) : 0;
    const newOffset = maxOffset + 5;
    setSteps(prev => [...prev, {
      days_offset: newOffset,
      type: getTypeFromOffset(newOffset),
      subject: getDefaultSubject(newOffset),
      content: getDefaultContent(newOffset),
    }]);
  }

  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }

  function updateOffset(idx: number, offset: number) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, days_offset: offset, type: getTypeFromOffset(offset) } : s));
  }

  function updateField(idx: number, field: "subject" | "content", value: string) {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function handleSave() {
    if (steps.length === 0) { toast.error("Adicione pelo menos uma etapa."); return; }
    setSaving(true);
    try {
      await fetchUseQuery<any, any>({
        route: `/billing/rules/${clientId}`,
        method: "POST",
        data: {
          useDefaultTemplates: false,
          recurrence,
          templates: steps.map(s => ({
            type: s.type,
            days_offset: s.days_offset,
            subject: s.subject,
            content: s.content,
          })),
        },
      });
      toast.success("Régua configurada com sucesso!");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar régua. Verifique se o cliente tem data de vencimento.");
    } finally {
      setSaving(false);
    }
  }

  const sortedSteps = [...steps]
    .map((s, origIdx) => ({ ...s, origIdx }))
    .sort((a, b) => a.days_offset - b.days_offset);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: 620, borderRadius: 18, padding: 0, overflow: "hidden" }}>
        <DialogTitle style={{ display: "none" }}>Configurar Régua</DialogTitle>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "22px 28px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Settings size={17} color="#6366f1" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Configurar Régua de Cobrança</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>
              Defina quando e o que será enviado ao cliente
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 28px", maxHeight: "58vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Variáveis */}
          <div style={{
            background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)",
            borderRadius: 10, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Variáveis disponíveis
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["{nome}", "{valor}", "{vencimento}", "{chave_pix}"].map(v => (
                <code key={v} style={{ background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: 4, fontSize: 11, color: "var(--foreground)" }}>
                  {v}
                </code>
              ))}
            </div>
          </div>

          {/* Nichos */}
          {(niches.length > 0 || loadingNiches) && (
            <div style={{
              background: "rgba(0,200,150,0.03)", border: "1px solid rgba(0,200,150,0.12)",
              borderRadius: 12, padding: "14px",
            }}>
              <div style={{ fontSize: 12, color: "#00C896", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                📋 Aplicar template por nicho {loadingNiches && <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted-foreground)" }}>(carregando...)</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                {niches.map(niche => (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => applyNiche(niche)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      padding: "10px 8px",
                      background: selectedNiche?.id === niche.id ? "rgba(0,200,150,0.12)" : "rgba(255,255,255,0.03)",
                      border: `2px solid ${selectedNiche?.id === niche.id ? "#00C896" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{niche.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", textAlign: "center" }}>{niche.name}</span>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{niche.templates?.length || 0} etapas</span>
                    {selectedNiche?.id === niche.id && (
                      <span style={{ fontSize: 10, color: "#00C896", fontWeight: 600 }}>✓ Ativo</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {sortedSteps.map(({ origIdx, ...step }) => (
            <div key={origIdx} style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${editingIdx === origIdx ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
                {/* offset badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: step.days_offset < 0 ? "rgba(245,158,11,0.1)" : step.days_offset === 0 ? "rgba(0,200,150,0.1)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${step.days_offset < 0 ? "rgba(245,158,11,0.2)" : step.days_offset === 0 ? "rgba(0,200,150,0.2)" : "rgba(239,68,68,0.15)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  color: step.days_offset < 0 ? "#f59e0b" : step.days_offset === 0 ? "#00C896" : "#ef4444",
                }}>
                  {step.days_offset < 0 ? `D${step.days_offset}` : step.days_offset === 0 ? "D0" : `D+${step.days_offset}`}
                </div>

                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 600, whiteSpace: "nowrap" }}>Dias:</label>
                  <input
                    type="number"
                    value={step.days_offset}
                    onChange={e => updateOffset(origIdx, parseInt(e.target.value) || 0)}
                    style={{
                      width: 64, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, padding: "5px 8px", fontSize: 13, fontWeight: 600,
                      color: "var(--foreground)", textAlign: "center", outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                    {step.days_offset < 0 ? "antes" : step.days_offset === 0 ? "no dia" : "após"} o vencimento
                  </span>
                </div>

                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setEditingIdx(editingIdx === origIdx ? null : origIdx)}
                    style={{
                      background: editingIdx === origIdx ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${editingIdx === origIdx ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                      color: editingIdx === origIdx ? "#6366f1" : "var(--muted-foreground)",
                    }}
                  >
                    {editingIdx === origIdx ? "Fechar" : "Editar msg"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(origIdx)}
                    disabled={steps.length <= 1}
                    style={{
                      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 6, padding: "5px 7px", cursor: steps.length <= 1 ? "not-allowed" : "pointer",
                      color: "#ef4444", opacity: steps.length <= 1 ? 0.3 : 1,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {editingIdx === origIdx && (
                <div style={{
                  padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ height: 8 }} />
                  <div>
                    <label style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                      Assunto
                    </label>
                    <input
                      value={step.subject}
                      onChange={e => updateField(origIdx, "subject", e.target.value)}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--foreground)", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                      Mensagem
                    </label>
                    <textarea
                      value={step.content}
                      onChange={e => updateField(origIdx, "content", e.target.value)}
                      rows={5}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--foreground)",
                        lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add step */}
          <button
            type="button"
            onClick={addStep}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "12px 16px", cursor: "pointer",
              color: "var(--muted-foreground)", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <Plus size={14} /> Adicionar etapa
          </button>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 28px",
          display: "flex", flexDirection: "column", gap: 10, background: "rgba(255,255,255,0.01)",
        }}>
          {/* Recorrência */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "10px 14px",
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C0D5CC" }}>Renovação automática</div>
              <div style={{ fontSize: 11, color: "#5A7A70", marginTop: 2 }}>
                {recurrence === "monthly" ? "Novo ciclo gerado todo mês automaticamente" : "Apenas este ciclo, sem renovação"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["none", "monthly"] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRecurrence(opt)}
                  style={{
                    padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    border: `1px solid ${recurrence === opt ? "rgba(0,200,150,0.35)" : "rgba(255,255,255,0.08)"}`,
                    background: recurrence === opt ? "rgba(0,200,150,0.12)" : "transparent",
                    color: recurrence === opt ? "#00C896" : "#5A7A70",
                  }}
                >
                  {opt === "none" ? "Único" : "Mensal"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || steps.length === 0}
            style={{
              flex: 1, background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px",
              fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer",
              transition: "opacity 0.15s", opacity: saving || steps.length === 0 ? 0.6 : 1,
            }}
          >
            {saving ? "Salvando..." : `Salvar régua (${steps.length} etapa${steps.length !== 1 ? "s" : ""})`}
          </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
