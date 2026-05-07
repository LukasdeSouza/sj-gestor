import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { PopoverContent, PopoverTrigger } from "../ui/popover";
import { Client } from "@/api/models/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import ComboboxDebounce from "../ComboboxDebounce";
import { Popover } from "@radix-ui/react-popover";
import { Product } from "@/api/models/products";
import { PixKey } from "@/api/models/pixKeys";
import { mascaraTelefone } from "@/utils/mask";
import ButtonLoading from "../ButtonLoading";
import { AuthUser } from "@/api/models/auth";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import type { ProductsResponse } from "@/api/models/products";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { z } from "zod";
import {
  Plus, Users, Package, CalendarIcon, Zap, CheckCircle2,
  ChevronLeft, ChevronRight, Info,
} from "lucide-react";

// ─── BILLING DEFAULTS ────────────────────────────────────────────────────────

const DEFAULT_BILLING_STEPS = [
  { days_offset: -3, type: "pre_vencimento",  label: "D-3", desc: "Lembrete 3 dias antes" },
  { days_offset:  0, type: "vencimento",       label: "D0",  desc: "No dia do vencimento"  },
  { days_offset:  3, type: "pos_vencimento",   label: "D+3", desc: "Cobrança 3 dias depois"},
];

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name:                          z.string().min(3).max(256),
  phone:                         z.string().regex(/^\d{8,11}$/, "O telefone deve conter apenas números (8 a 11 dígitos)"),
  email:                         z.string().email("Email inválido").max(256).optional(),
  user_id:                       z.string(),
  due_at:                        z.union([z.string().datetime().transform((v) => new Date(v)), z.date()]),
  additional_info:               z.string().max(256).optional(),
  product_id:                    z.string().optional(),
  observacoes1:                  z.string().max(256).optional(),
  observacoes2:                  z.string().max(256).optional(),
  new_product_name:              z.string().optional(),
  new_product_value:             z.number().optional(),
  new_product_description:       z.string().optional(),
  new_product_late_fee_percent:  z.number().min(0).max(100).optional(),
  new_product_late_interest_percent: z.number().min(0).max(100).optional(),
  key_id:                        z.string().optional(),
});

type FormValues = z.infer<typeof createSchema>;

// ─── STYLE TOKENS ─────────────────────────────────────────────────────────────

const INPUT_CLS = "cobr-popup-input";
const LABEL_CLS = "cobr-popup-label";

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      fontSize: 10, fontWeight: 700, color: "#64748B",
      textTransform: "uppercase", letterSpacing: 1.2,
      borderBottom: "1px solid #F1F5F9",
      paddingBottom: "0.55rem", marginBottom: "0.85rem",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <Icon size={13} color="#00C896" />
      {title}
    </div>
  );
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  const labels = ["Cliente", "Produto", "Régua"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.25rem" }}>
      {Array.from({ length: total }).map((_, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < total - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "#00C896" : current ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${done ? "#00C896" : current ? "#00C896" : "rgba(255,255,255,0.12)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: done ? "#051A12" : current ? "#00C896" : "#3A5A50",
                transition: "all 0.2s",
              }}>
                {done ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, color: current ? "#00C896" : done ? "#5A8A78" : "#3A5A50", fontWeight: current ? 700 : 500 }}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? "rgba(0,200,150,0.3)" : "#E2E8F0", margin: "0 8px", marginBottom: 18, transition: "background 0.2s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props { onSuccess: () => void; }

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function PopupCreateClient({ onSuccess }: Props) {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;
  const navigate = useNavigate();

  const [open, setOpen]               = useState(false);
  const [step, setStep]               = useState(0);          // 0=Cliente 1=Produto 2=Régua
  const [isPending, setIsPending]     = useState(false);
  const [productMode, setProductMode] = useState<"existing" | "new">("existing");
  const [productValue, setProductValue] = useState<Product | undefined>();
  const [pixKeyValue, setPixKeyValue] = useState<PixKey | undefined>();
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [preferredChannels, setPreferredChannels] = useState<string[]>(["whatsapp"]);
  const [recurrence, setRecurrence] = useState<"none" | "monthly">("none");
  const [consentimento, setConsentimento] = useState(false);

  const sub = useSubscriptionGuard();
  const isAtLimit = sub?.usage && sub.usage.limit > 0 && sub.usage.current >= sub.usage.limit;

  // smart defaults — pre-select first product
  const { data: defaultsData } = useQuery({
    queryKey: ["smartDefaults", parsedUser?.id],
    queryFn: async () => {
      const productsRes = await fetchUseQuery<undefined, ProductsResponse>({ route: "/products?limit=1", method: "GET" });
      return { product: productsRes.products?.[0] ?? null };
    },
    enabled: open && !!parsedUser?.id,
    staleTime: 30_000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "", phone: "", email: undefined, due_at: new Date(),
      additional_info: undefined, user_id: parsedUser?.id,
      product_id: "",
      observacoes1: "", observacoes2: "",
      new_product_name: "", new_product_value: undefined,
      new_product_description: undefined,
      new_product_late_fee_percent: undefined,
      new_product_late_interest_percent: undefined,
      key_id: undefined,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (!defaultsData) return;
    if (defaultsData.product && !form.getValues("product_id")) {
      form.setValue("product_id", defaultsData.product.id);
      setProductValue(defaultsData.product);
    }
  }, [defaultsData]);

  function resetAllState() {
    setStep(0);
    setProductMode("existing");
    setProductValue(undefined);
    setPixKeyValue(undefined);
    setBillingEnabled(true);
    setPreferredChannels(["whatsapp"]);
    setRecurrence("none");
    setConsentimento(false);
    reset({
      name: "", phone: "", email: undefined, due_at: new Date(),
      additional_info: undefined, user_id: parsedUser?.id,
      product_id: "",
      observacoes1: "", observacoes2: "",
      new_product_name: "", new_product_value: undefined,
      new_product_description: undefined,
      new_product_late_fee_percent: undefined,
      new_product_late_interest_percent: undefined,
      key_id: undefined,
    });
  }

  useEffect(() => { if (!open) resetAllState(); }, [open]);

  // ── step 0 validation ─────────────────────────────────────────────────────

  async function goToStep1() {
    const ok = await form.trigger(["name", "phone", "email", "due_at"]);
    if (ok) setStep(1);
  }

  // ── step 1 validation ─────────────────────────────────────────────────────

  function goToStep2() {
    const values = form.getValues();
    if (productMode === "existing") {
      if (!values.product_id) { toast.error("Selecione um produto ou crie um novo."); return; }
    } else {
      if (!values.new_product_name || values.new_product_name.length < 3) {
        toast.error("Nome do produto deve ter ao menos 3 caracteres."); return;
      }
      if (!values.new_product_value || values.new_product_value < 0.01) {
        toast.error("Valor do produto deve ser maior que 0."); return;
      }
    }
    setStep(2);
  }

  // ── submit ────────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setIsPending(true);
    try {
      let productId = values.product_id;

      if (productMode === "new") {
        const newProduct = await fetchUseQuery<Record<string, unknown>, Product>({
          route: "/products", method: "POST",
          data: {
            name: values.new_product_name,
            value: values.new_product_value,
            description: values.new_product_description || undefined,
            late_fee_percent: values.new_product_late_fee_percent,
            late_interest_percent: values.new_product_late_interest_percent,
            user_id: parsedUser?.id,
          },
        });
        productId = newProduct.id;
      }

      const payload: Record<string, unknown> = {
        name: values.name, phone: values.phone, email: values.email || undefined,
        due_at: values.due_at, user_id: parsedUser?.id,
        product_id: productId,
        key_id: values.key_id || undefined,
        observacoes1: values.observacoes1 || undefined,
        observacoes2: values.observacoes2 || undefined,
        preferred_channels: preferredChannels,
      };

      const newClient = await fetchUseQuery<typeof payload, Client>({ route: "/clients", method: "POST", data: payload });

      if (billingEnabled && newClient?.id) {
        try {
          await fetchUseQuery<any, any>({
            route: `/billing/rules/${newClient.id}`,
            method: "POST",
            data: {
              useDefaultTemplates: false,
              recurrence,
              templates: DEFAULT_BILLING_STEPS.map(s => ({
                type: s.type,
                days_offset: s.days_offset,
                subject: s.days_offset < 0
                  ? "Lembrete de pagamento - {nome}"
                  : s.days_offset === 0
                  ? "Pagamento hoje - {nome}"
                  : "Pagamento em atraso - {nome}",
                content: s.days_offset < 0
                  ? "Olá, {nome}! 👋\n\nSeu pagamento de {valor} vence em {vencimento}.\n\nVocê pode pagar via PIX ou Cartão acessando seu link exclusivo:\n🔗 {link_pagamento}\n\nQualquer dúvida, estamos à disposição!"
                  : s.days_offset === 0
                  ? "Olá, {nome}! 📅\n\nHoje é dia de pagamento!\n\nValor: {valor}\n\nPague agora pelo link seguro:\n🔗 {link_pagamento}\n\nSe já pagou, pode ignorar esta mensagem."
                  : "Olá, {nome}! ⚠️\n\nSeu pagamento de {valor} (vencimento: {vencimento}) está em atraso.\n\nAcesse seu link para regularizar agora:\n🔗 {link_pagamento}\n\nApós o pagamento, envie o comprovante.",
              })),
            },
          });
        } catch {
          toast.warning("Cobrança criada, mas a régua automática não pôde ser configurada.");
        }
      }

      toast.success("Cobrança criada com sucesso!");
      setOpen(false);
      onSuccess();
    } catch (error) {
      const apiError = error as ApiErrorQuery;
      if (Array.isArray(apiError?.errors)) handleErrorMessages(apiError.errors);
      else toast.error("Erro ao criar cobrança.");
    } finally {
      setIsPending(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        .cobr-popup-input {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          color: #0F172A !important;
          font-size: 13px !important;
          font-family: "Montserrat", sans-serif !important;
          height: 40px !important;
          transition: border-color 0.2s !important;
        }
        .cobr-popup-input:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
          outline: none !important;
        }
        .cobr-popup-input::placeholder { color: #94A3B8 !important; }
        .cobr-popup-input:disabled { opacity: 0.5 !important; }

        .cobr-popup-textarea {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          color: #0F172A !important;
          font-size: 13px !important;
          font-family: "Montserrat", sans-serif !important;
          resize: vertical !important;
          transition: border-color 0.2s !important;
        }
        .cobr-popup-textarea:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
          outline: none !important;
        }
        .cobr-popup-textarea::placeholder { color: #94A3B8 !important; }

        .cobr-popup-label {
          font-size: 12px !important;
          font-weight: 500 !important;
          color: #475569 !important;
          margin-bottom: 4px !important;
        }

        .cobr-popup-hint {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 4px;
        }

        .cobr-cal-btn {
          width: 100%; height: 40px;
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          color: #0F172A !important;
          font-size: 13px !important;
          font-family: "Montserrat", sans-serif !important;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 12px; cursor: pointer;
          transition: border-color 0.2s;
        }
        .cobr-cal-btn:hover { border-color: rgba(0,200,150,0.3) !important; }
        .cobr-cal-btn.empty { color: #94A3B8 !important; }

        .cobr-submit {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: #00C896 !important; color: #FFFFFF !important;
          border: none !important; border-radius: 8px !important;
          padding: 0.7rem 1.5rem !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.88rem !important; font-weight: 700 !important;
          cursor: pointer !important; transition: background 0.2s !important;
          width: 100% !important;
        }
        .cobr-submit:hover:not(:disabled) { background: #00A87E !important; }
        .cobr-submit:disabled { opacity: 0.65 !important; cursor: not-allowed !important; }

        .cobr-btn-secondary {
          display: inline-flex; align-items: center; gap: 5px;
          background: transparent; color: #64748B;
          border: 1px solid #E2E8F0; border-radius: 8px;
          padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s; font-family: "Montserrat", sans-serif;
        }
        .cobr-btn-secondary:hover { border-color: #CBD5E1; color: #334155; }

        .cobr-mode-btn {
          padding: 0.38rem 0.85rem; border-radius: 7px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: "Montserrat", sans-serif;
          transition: all 0.15s;
        }

        .cobr-tax-box {
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          padding: 14px 16px;
          background: #F8FAFC;
          margin-top: 0.65rem;
        }
      `}</style>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button id="btn-new-client">
            <Plus className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>
        </DialogTrigger>

        <DialogContent style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 18,
          maxWidth: 580,
          maxHeight: "92vh",
          overflowY: "auto",
          fontFamily: "\"Google Sans\", sans-serif",
          color: "#0F172A",
        }}>
          <DialogHeader style={{ marginBottom: "0.25rem" }}>
            <DialogTitle style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", letterSpacing: -0.3 }}>
              {isAtLimit ? "Limite do Plano Atingido" : "Nova Cobrança"}
            </DialogTitle>
          </DialogHeader>

          {isAtLimit ? (
            <div style={{ padding: "1rem 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(0,200,150,0.1)", color: "#00C896", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={32} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                  Hora de dar o próximo passo! 🚀
                </h3>
                <p style={{ color: "#7A9087", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Você atingiu o limite de <b>{sub?.usage?.limit} clientes</b> do plano {sub?.planName}.
                  Assine o plano <b>Starter</b> para liberar até 150 clientes e automação via E-mail!
                </p>
              </div>
              <button type="button" className="cobr-submit" onClick={() => navigate("/plans")}>
                Ver Planos Disponíveis
              </button>
            </div>
          ) : (
            <Form {...form}>
              <form style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }} onSubmit={form.handleSubmit(onSubmit as any)}>

                <StepIndicator step={step} total={3} />

                {/* ══════════════ STEP 0: CLIENTE ══════════════ */}
                {step === 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <SectionHeader icon={Users} title="Dados do cliente" />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Nome <span style={{ color: "#E84545" }}>*</span></FormLabel>
                            <FormControl>
                              <Input className={INPUT_CLS} placeholder="Nome do cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Telefone <span style={{ color: "#E84545" }}>*</span></FormLabel>
                            <FormControl>
                              <Input
                                className={INPUT_CLS}
                                placeholder="(00) 00000-0000"
                                {...field}
                                value={mascaraTelefone(field.value)}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                onBlur={() => {
                                  const v = field.value.replace(/\D/g, "");
                                  if (v.length === 10 && v[2] !== "9") field.onChange(v.slice(0, 2) + "9" + v.slice(2));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="cobr-popup-hint">DDD + 9 dígitos. Ex.: 69 9XXXX-XXXX</p>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>E-mail (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                className={INPUT_CLS}
                                placeholder="email@exemplo.com"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value.trim() === "" ? undefined : e.target.value.trim())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="due_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Vencimento <span style={{ color: "#E84545" }}>*</span></FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <button type="button" className={cn("cobr-cal-btn", !field.value && "empty")}>
                                    <span>{field.value ? format(field.value, "dd/MM/yyyy") : "Selecione uma data"}</span>
                                    <CalendarIcon size={14} style={{ color: "#64748B" }} />
                                  </button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent align="start" style={{ padding: 0, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12 }}>
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => field.onChange(date instanceof Date ? date : null)}
                                  defaultMonth={field.value || new Date()}
                                  captionLayout="dropdown"
                                />
                                <button
                                  type="button"
                                  onClick={() => field.onChange(null)}
                                  style={{ width: "100%", padding: "0.5rem", background: "none", border: "none", borderTop: "1px solid #F1F5F9", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: "\"Google Sans\", sans-serif" }}
                                >
                                  Limpar data
                                </button>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                      <button type="button" className="cobr-submit" style={{ width: "auto", padding: "0.6rem 1.5rem" }} onClick={goToStep1}>
                        Próximo <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════════ STEP 1: PRODUTO ══════════════ */}
                {step === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <SectionHeader icon={Package} title="Produto / Serviço" />

                    {/* Mode toggle */}
                    <div style={{ display: "flex", gap: 4, marginBottom: "0.25rem" }}>
                      {([
                        { value: "existing", label: "Selecionar existente" },
                        { value: "new",      label: "Criar novo" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className="cobr-mode-btn"
                          onClick={() => setProductMode(opt.value)}
                          style={{
                            border: `1px solid ${productMode === opt.value ? "rgba(0,200,150,0.3)" : "#E2E8F0"}`,
                            background: productMode === opt.value ? "rgba(0,200,150,0.1)" : "transparent",
                            color: productMode === opt.value ? "#00C896" : "#64748B",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {productMode === "existing" && (
                      <FormField
                        control={form.control}
                        name="product_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Produto <span style={{ color: "#E84545" }}>*</span></FormLabel>
                            <FormControl>
                              <ComboboxDebounce
                                route="/products?name"
                                queryKey="productsQueryKey"
                                dataField="products"
                                placeholderInputSearch="Busque por nome"
                                placeholderUnselected="Selecione o produto"
                                selecionado={field.value as unknown as Product[] ?? productValue as Product}
                                setSelecionado={(value) => { const b = value as unknown as Product; field.onChange(b.id); setProductValue(b); }}
                                selectedField={(s: Product) => s?.name}
                                renderOption={(d) => <span key={(d as unknown as Product).id}>{typeof d === "string" ? d : (d as Product)?.name}</span>}
                                visualizacao={productValue?.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {productMode === "new" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                          <FormField
                            control={form.control}
                            name="new_product_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={LABEL_CLS}>Nome <span style={{ color: "#E84545" }}>*</span></FormLabel>
                                <FormControl><Input className={INPUT_CLS} placeholder="Nome do produto" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_product_value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={LABEL_CLS}>Valor (R$) <span style={{ color: "#E84545" }}>*</span></FormLabel>
                                <FormControl>
                                  <Input
                                    className={INPUT_CLS}
                                    type="number" step="0.01" min="0" placeholder="0,00"
                                    value={field.value === undefined ? "" : field.value}
                                    onChange={(e) => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? undefined : v); }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="new_product_description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={LABEL_CLS}>Descrição (opcional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  className="cobr-popup-textarea"
                                  rows={2} placeholder="Descrição do produto..."
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Taxa de atraso */}
                        <div className="cobr-tax-box">
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
                            Taxa de atraso (opcional)
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            <FormField
                              control={form.control}
                              name="new_product_late_fee_percent"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={LABEL_CLS}>Multa <span style={{ color: "#64748B", fontWeight: 400 }}>(%)</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      className={INPUT_CLS}
                                      type="number" step="0.01" min="0" max="100" placeholder="ex: 2"
                                      value={field.value === undefined ? "" : field.value}
                                      onChange={(e) => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? undefined : v); }}
                                    />
                                  </FormControl>
                                  <p className="cobr-popup-hint">Aplicada uma vez no D+1</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="new_product_late_interest_percent"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={LABEL_CLS}>Juros <span style={{ color: "#64748B", fontWeight: 400 }}>(% ao mês)</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      className={INPUT_CLS}
                                      type="number" step="0.01" min="0" max="100" placeholder="ex: 1"
                                      value={field.value === undefined ? "" : field.value}
                                      onChange={(e) => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? undefined : v); }}
                                    />
                                  </FormControl>
                                  <p className="cobr-popup-hint">Proporcional por dia de atraso</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chave PIX */}
                    <div style={{ marginTop: "0.25rem" }}>
                      <FormField
                        control={form.control}
                        name="key_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Chave PIX (opcional)</FormLabel>
                            <FormControl>
                              <ComboboxDebounce
                                route="/pix_keys?name"
                                queryKey="pixKeysQueryKey"
                                dataField="keys"
                                placeholderInputSearch="Busque por chave"
                                placeholderUnselected="Selecione a chave PIX"
                                selecionado={field.value as unknown as PixKey[] ?? pixKeyValue as PixKey}
                                setSelecionado={(value) => { const b = value as unknown as PixKey; field.onChange(b.id); setPixKeyValue(b); }}
                                selectedField={(s: PixKey) => s?.key_value}
                                renderOption={(d) => <span key={(d as unknown as PixKey).id}>{typeof d === "string" ? d : (d as PixKey)?.key_value}</span>}
                                visualizacao={pixKeyValue?.key_value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div style={{
                        marginTop: "0.5rem",
                        display: "flex", alignItems: "flex-start", gap: 7,
                        padding: "8px 10px",
                        background: "rgba(0,200,150,0.05)",
                        border: "1px solid rgba(0,200,150,0.1)",
                        borderRadius: 8,
                        fontSize: 11, color: "#64748B", lineHeight: 1.5,
                      }}>
                        <Info size={12} style={{ color: "#3A8A70", flexShrink: 0, marginTop: 1 }} />
                        <span>
                          O cliente recebe um <strong style={{ color: "#00C896" }}>link único</strong> com todos os seus meios de pagamento cadastrados.
                          A chave PIX selecionada aqui define qual aparece no QR code da cobrança.
                          Se não selecionar, será usada a primeira chave cadastrada.
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                      <button type="button" className="cobr-btn-secondary" onClick={() => setStep(0)}>
                        <ChevronLeft size={14} /> Voltar
                      </button>
                      <button type="button" className="cobr-submit" style={{ width: "auto", padding: "0.6rem 1.5rem" }} onClick={goToStep2}>
                        Próximo <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════════ STEP 2: RÉGUA ══════════════ */}
                {step === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

                    {/* Régua de cobrança */}
                    <div style={{
                      border: `1px solid ${billingEnabled ? "rgba(0,200,150,0.2)" : "#E2E8F0"}`,
                      borderRadius: 12,
                      background: billingEnabled ? "rgba(0,200,150,0.05)" : "#F8FAFC",
                      padding: "14px 16px",
                      transition: "all 0.2s",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: billingEnabled ? 14 : 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: billingEnabled ? "#0F172A" : "#94A3B8" }}>
                          Régua de cobrança automática
                        </span>
                        <button
                          type="button"
                          onClick={() => setBillingEnabled(v => !v)}
                          style={{
                            width: 40, height: 22, borderRadius: 11,
                            background: billingEnabled ? "#00C896" : "rgba(255,255,255,0.1)",
                            border: "none", cursor: "pointer", position: "relative",
                            transition: "background 0.2s", flexShrink: 0,
                          }}
                        >
                          <span style={{
                            position: "absolute", top: 3,
                            left: billingEnabled ? 20 : 3,
                            width: 16, height: 16, borderRadius: "50%",
                            background: "#fff", transition: "left 0.2s",
                          }} />
                        </button>
                      </div>

                      {billingEnabled && (
                        <div>
                           <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 12px" }}>
                            Mensagens automáticas serão enviadas nos seguintes momentos:
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                            {DEFAULT_BILLING_STEPS.map((s, i) => (
                              <div key={s.days_offset} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                                  <div style={{
                                    width: 34, height: 34, borderRadius: "50%",
                                    background: s.days_offset === 0 ? "rgba(0,200,150,0.1)" : "#F1F5F9",
                                    border: `2px solid ${s.days_offset === 0 ? "#00C896" : "#E2E8F0"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <CheckCircle2 size={14} color={s.days_offset === 0 ? "#00C896" : "#94A3B8"} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: s.days_offset === 0 ? "#00C896" : "#64748B" }}>{s.label}</span>
                                  <span style={{ fontSize: 10, color: "#64748B", textAlign: "center", lineHeight: 1.3 }}>{s.desc}</span>
                                </div>
                                {i < DEFAULT_BILLING_STEPS.length - 1 && (
                                  <div style={{ height: 1, width: 20, background: "#E2E8F0", marginBottom: 20, flexShrink: 0 }} />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Canais */}
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>Canais de envio:</p>
                            <div style={{ display: "flex", gap: 6 }}>
                              {([
                                { key: "whatsapp", label: "WhatsApp", color: "#25D366" },
                                { key: "email",    label: "E-mail",   color: "#6366f1" },
                                { key: "sms",      label: "SMS",      color: "#F5A623" },
                              ] as const).map(({ key, label, color }) => {
                                const active = preferredChannels.includes(key);
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setPreferredChannels(prev => active ? prev.filter(c => c !== key) : [...prev, key])}
                                    style={{
                                      padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                                      cursor: "pointer", transition: "all 0.15s",
                                      border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`,
                                      background: active ? color + "18" : "transparent",
                                      color: active ? color : "#64748B",
                                    }}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Recorrência */}
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                            <p style={{ fontSize: 11, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>Recorrência:</p>
                            <div style={{ display: "flex", gap: 6 }}>
                              {([
                                { value: "none",    label: "Único" },
                                { value: "monthly", label: "Mensal" },
                              ] as const).map(({ value, label }) => {
                                const active = recurrence === value;
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => setRecurrence(value)}
                                    style={{
                                      padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                                      cursor: "pointer", transition: "all 0.15s",
                                      border: `1px solid ${active ? "rgba(0,200,150,0.35)" : "rgba(255,255,255,0.08)"}`,
                                      background: active ? "rgba(0,200,150,0.12)" : "transparent",
                                      color: active ? "#00C896" : "#64748B",
                                    }}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                            {recurrence === "monthly" && (
                              <p style={{ fontSize: 10, color: "#94A3B8", marginTop: 6 }}>
                                Nova régua gerada automaticamente todo mês após o ciclo ser concluído.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Observações */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <FormField
                        control={form.control}
                        name="observacoes1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Observações 1 (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                className="cobr-popup-textarea"
                                rows={2} placeholder="Observações relacionadas a esta cobrança..."
                                {...field}
                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="observacoes2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={LABEL_CLS}>Observações 2 (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                className="cobr-popup-textarea"
                                rows={2} placeholder="Observações relacionadas a esta cobrança..."
                                {...field}
                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Consent */}
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: "#F8FAFC", padding: "12px 14px", borderRadius: 10, border: "1px solid #F1F5F9" }}>
                      <input
                        type="checkbox"
                        checked={consentimento}
                        onChange={(e) => setConsentimento(e.target.checked)}
                        style={{ marginTop: 2, accentColor: "#00C896", width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4, fontFamily: "\"Google Sans\", sans-serif" }}>
                        Declaro que possuo o <strong>consentimento expresso</strong> deste cliente para cadastrar seus dados pessoais e enviar comunicações via e-mail, SMS ou WhatsApp.
                      </span>
                    </label>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <button type="button" className="cobr-btn-secondary" onClick={() => setStep(1)}>
                        <ChevronLeft size={14} /> Voltar
                      </button>
                      <ButtonLoading isLoading={isPending} disabled={!consentimento || isPending} type="submit" className="cobr-submit" style={{ width: "auto", padding: "0.6rem 1.5rem" }}>
                        Criar Cobrança
                      </ButtonLoading>
                    </div>
                  </div>
                )}

              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
