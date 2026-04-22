import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageTemplate, MessageTemplatesResponse } from "@/api/models/messageTemplate";
import SkeletonInformation from "@/components/Skeletons/SkeletonInformation";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { MessageTemplateSchemas } from "@/schemas/TemplateSchema";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import ButtonLoading from "@/components/ButtonLoading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthUser } from "@/api/models/auth";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { z } from "zod";
import { Plus, Pencil, Trash2, FileText, Lock, Tag, Eye } from "lucide-react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const VARIABLES = [
  { tag: "{nome}",       label: "Nome"       },
  { tag: "{valor}",      label: "Valor"      },
  { tag: "{vencimento}", label: "Vencimento" },
  { tag: "{email}",      label: "E-mail"     },
  { tag: "{telefone}",   label: "Telefone"   },
  { tag: "{dias}",       label: "Dias"       },
];



// ─── HELPERS ─────────────────────────────────────────────────────────────────

function extractVariables(content: string) {
  return [...new Set(content.match(/\{[^}]+\}/g) ?? [])];
}

function applyPreview(content: string) {
  return content
    .replace(/\{nome\}/g, "João Silva")
    .replace(/\{valor\}/g, "R$ 150,00")
    .replace(/\{vencimento\}/g, "05/04/2026")
    .replace(/\{email\}/g, "joao@email.com")
    .replace(/\{telefone\}/g, "(11) 99999-9999")
    .replace(/\{dias\}/g, "3");
}

// ─── SHARED STYLES ───────────────────────────────────────────────────────────

const DIALOG_STYLE: React.CSSProperties = {
  background: "#0D1210",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "#111614",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  color: "#F0F5F2",
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 500,
  color: "#7A9087",
  marginBottom: "0.35rem",
  display: "block",
};

// ─── TEMPLATE FORM ────────────────────────────────────────────────────────────

interface TemplateFormProps {
  defaultValues: { name: string; content: string; user_id: string };
  isPending: boolean;
  onSubmit: (values: { name: string; content: string; user_id: string }) => void;
  submitLabel: string;
}

function TemplateForm({ defaultValues, isPending, onSubmit, submitLabel }: TemplateFormProps) {
  const schema = MessageTemplateSchemas.create;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const content = form.watch("content");

  useEffect(() => {
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues.name, defaultValues.content]);

  function insertVariable(tag: string) {
    form.setValue("content", form.getValues("content") + tag, { shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={form.handleSubmit(onSubmit)}>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel style={LABEL_STYLE}>
                Nome do template <span style={{ color: "#E84545" }}>*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Lembrete de vencimento"
                  className="tmpl-input"
                  style={INPUT_STYLE}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel style={LABEL_STYLE}>
                Mensagem <span style={{ color: "#E84545" }}>*</span>
              </FormLabel>
              {/* Variable pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "rgba(0,200,150,0.07)",
                      border: "1px dashed rgba(0,200,150,0.3)",
                      color: "#00C896", borderRadius: 100,
                      padding: "3px 10px", fontSize: 11, fontWeight: 600,
                      cursor: "pointer", transition: "background 0.15s",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,200,150,0.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,200,150,0.07)")}
                  >
                    <Tag size={9} /> {v.label}
                  </button>
                ))}
              </div>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Digite sua mensagem aqui..."
                  className="tmpl-input"
                  style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.6, padding: "0.65rem 0.85rem" }}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview */}
        {content && (
          <div style={{
            background: "rgba(0,200,150,0.04)", border: "1px solid rgba(0,200,150,0.12)",
            borderRadius: 9, padding: "0.85rem 1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#3A7A60", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              <Eye size={11} /> Preview
            </div>
            <p style={{ fontSize: 13, color: "#C0D5CC", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>
              {applyPreview(content)}
            </p>
          </div>
        )}

        <ButtonLoading
          isLoading={isPending}
          type="submit"
          style={{
            background: "#00C896", color: "#051A12", border: "none",
            borderRadius: 8, padding: "0.7rem 1.25rem",
            fontFamily: "'Syne', sans-serif", fontSize: "0.85rem", fontWeight: 700,
            cursor: "pointer", width: "100%",
          }}
        >
          {submitLabel}
        </ButtonLoading>
      </form>
    </Form>
  );
}

// ─── CREATE DIALOG ────────────────────────────────────────────────────────────

function CreateTemplateDialog({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { name: string; content: string; user_id: string }) =>
      fetchUseQuery<typeof data, MessageTemplate>({ route: "/message_templates", method: "POST", data }),
    onSuccess: () => { toast.success("Template criado com sucesso!"); setOpen(false); onSuccess(); },
    onError: (error: ApiErrorQuery) => { if (Array.isArray(error.errors)) handleErrorMessages(error.errors); },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button id="btn-new-template" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#00C896", color: "#051A12", border: "none",
          borderRadius: 8, padding: "0.6rem 1.1rem",
          fontFamily: "'Syne', sans-serif", fontSize: "0.82rem", fontWeight: 700,
          cursor: "pointer",
        }}>
          <Plus size={14} /> Novo template
        </button>
      </DialogTrigger>
      <DialogContent style={DIALOG_STYLE}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Syne', sans-serif", color: "#F0F5F2", fontWeight: 800 }}>
            Criar template
          </DialogTitle>
        </DialogHeader>
        {open && (
          <TemplateForm
            defaultValues={{ name: "", content: "", user_id: userId }}
            isPending={isPending}
            onSubmit={mutate}
            submitLabel="Criar template"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── EDIT DIALOG ─────────────────────────────────────────────────────────────

function EditTemplateDialog({ template, onSuccess }: { template: MessageTemplate; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { name: string; content: string; user_id: string }) =>
      fetchUseQuery<typeof data, MessageTemplate>({ route: `/message_templates/${template.id}`, method: "PATCH", data }),
    onSuccess: () => { toast.success("Template atualizado!"); setOpen(false); onSuccess(); },
    onError: (error: ApiErrorQuery) => { if (Array.isArray(error.errors)) handleErrorMessages(error.errors); },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Editar"
          style={{
            background: "none", border: "1px solid rgba(255,255,255,0.07)",
            color: "#5A7A70", borderRadius: 7, padding: "5px 7px",
            cursor: "pointer", display: "inline-flex", alignItems: "center",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,200,150,0.3)"; e.currentTarget.style.color = "#00C896"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#5A7A70"; }}
        >
          <Pencil size={13} />
        </button>
      </DialogTrigger>
      <DialogContent style={DIALOG_STYLE}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Syne', sans-serif", color: "#F0F5F2", fontWeight: 800 }}>
            Editar template
          </DialogTitle>
        </DialogHeader>
        {open && (
          <TemplateForm
            defaultValues={{ name: template.name, content: template.content, user_id: template.user_id }}
            isPending={isPending}
            onSubmit={mutate}
            submitLabel="Salvar alterações"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── TEMPLATE CARD ────────────────────────────────────────────────────────────

function TemplateCard({
  template, onDelete, onSuccess, isDeleting,
}: {
  template: MessageTemplate;
  onDelete?: (id: string) => void;
  onSuccess?: () => void;
  isDeleting?: boolean;
}) {
  const isDefault = template.is_default;
  const vars = extractVariables(template.content);

  return (
    <div style={{
      background: "#111614", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "1.1rem 1.15rem",
      display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color 0.2s",
    }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,200,150,0.18)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: isDefault ? "rgba(100,150,220,0.1)" : "rgba(0,200,150,0.1)",
            border: `1px solid ${isDefault ? "rgba(100,150,220,0.2)" : "rgba(0,200,150,0.2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={13} color={isDefault ? "#6496DC" : "#00C896"} />
          </div>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontSize: "0.82rem",
            fontWeight: 700, color: "#C0D5CC",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {template.name}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {isDefault ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 700, color: "#3A5A50",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 100,
              padding: "2px 8px", fontFamily: "'Syne', sans-serif",
            }}>
              <Lock size={9} /> Padrão
            </span>
          ) : (
            <>
              <EditTemplateDialog template={template as MessageTemplate} onSuccess={onSuccess!} />
              <button
                title="Excluir"
                disabled={isDeleting}
                onClick={() => onDelete!(template.id)}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.07)",
                  color: "#3A5A50", borderRadius: 7, padding: "5px 7px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { if (!isDeleting) { e.currentTarget.style.borderColor = "rgba(232,69,69,0.3)"; e.currentTarget.style.color = "#E84545"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#3A5A50"; }}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content preview */}
      <p style={{
        fontSize: 12, color: "#5A7A70", lineHeight: 1.65, margin: 0,
        display: "-webkit-box", WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical", overflow: "hidden",
        whiteSpace: "pre-wrap",
      }}>
        {template.content}
      </p>

      {/* Variable tags */}
      {vars.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {vars.map((v) => (
            <span key={v} style={{
              fontSize: 10, fontFamily: "monospace",
              background: "rgba(0,200,150,0.06)", color: "#00C896",
              border: "1px solid rgba(0,200,150,0.15)", borderRadius: 100,
              padding: "2px 8px", fontWeight: 600,
            }}>
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

export function TemplatesContent() {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const { data, isLoading, refetch } = useQuery<MessageTemplatesResponse>({
    queryKey: ["listTemplates", parsedUser?.id],
    queryFn: () =>
      fetchUseQuery<{ user_id: string; page: number; limit: number }, MessageTemplatesResponse>({
        route: "/message_templates",
        method: "GET",
        data: { user_id: parsedUser.id, page: 1, limit: 100 },
      }),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: !!parsedUser?.id,
  });

  const { mutate: deleteTemplate, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) =>
      fetchUseQuery({ route: `/message_templates/${id}`, method: "DELETE" }),
    onSuccess: () => { toast.success("Template excluído."); refetch(); },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  if (isLoading) return <SkeletonInformation />;

  const allTemplates = data?.templates ?? [];
  const systemTemplates = allTemplates.filter(t => t.is_default);
  const userTemplates = allTemplates.filter(t => !t.is_default);

  const sectionLabel: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 700, color: "#3A5A50",
    textTransform: "uppercase", letterSpacing: 1.5,
    margin: "0 0 0.75rem",
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.85rem",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .tmpl-input:focus { border-color: rgba(0,200,150,0.4) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; outline: none !important; }
        .tmpl-input::placeholder { color: #2A4A40 !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.75rem", fontFamily: "'DM Sans', sans-serif", color: "#F0F5F2" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.5, margin: "0 0 3px" }}>
              Templates de mensagem
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#5A7A70", margin: 0 }}>
              Modelos reutilizáveis com variáveis dinâmicas para suas cobranças.
            </p>
          </div>
          <CreateTemplateDialog userId={parsedUser.id} onSuccess={refetch} />
        </div>

        {/* ── DEFAULT TEMPLATES ── */}
        {systemTemplates.length > 0 && (
          <div>
            <p style={sectionLabel}>Prontos para usar</p>
            <div style={grid}>
              {systemTemplates.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </div>
        )}

        {/* ── USER TEMPLATES ── */}
        <div>
          <p style={sectionLabel}>
            Meus templates{userTemplates.length > 0 && ` (${userTemplates.length})`}
          </p>

          {userTemplates.length === 0 ? (
            <div style={{
              background: "#111614",
              border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "2.5rem 1.5rem",
              textAlign: "center", color: "#3A5A50",
            }}>
              <FileText size={28} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
              <p style={{ fontSize: 13, margin: "0 0 4px", color: "#4A6A60" }}>
                Você ainda não criou nenhum template.
              </p>
              <p style={{ fontSize: 12, margin: 0, color: "#3A5050" }}>
                Clique em "Novo template" para começar.
              </p>
            </div>
          ) : (
            <div style={grid}>
              {userTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onDelete={deleteTemplate}
                  onSuccess={refetch}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Templates() {
  return (
    <DashboardLayout>
      <TemplatesContent />
    </DashboardLayout>
  );
}