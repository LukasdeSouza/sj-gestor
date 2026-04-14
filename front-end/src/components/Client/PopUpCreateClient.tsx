import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { MessageTemplate } from "@/api/models/messageTemplate";
import { PopoverContent, PopoverTrigger } from "../ui/popover";
import { CreateClientData } from "@/api/models/clients";
import { zodResolver } from "@hookform/resolvers/zod";
import ComboboxDebounce from "../ComboboxDebounce";
import { Popover } from "@radix-ui/react-popover";
import { Product } from "@/api/models/products";
import { mascaraTelefone } from "@/utils/mask";
import { PixKey } from "@/api/models/pixKeys";
import ButtonLoading from "../ButtonLoading";
import { AuthUser } from "@/api/models/auth";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductsResponse } from "@/api/models/products";
import type { PixKeysResponse } from "@/api/models/pixKeys";
import type { MessageTemplatesResponse } from "@/api/models/messageTemplate";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { z } from "zod";
import {
  Plus, Users, Package, CreditCard, MessageSquare,
  ChevronDown, ChevronUp, CalendarIcon, Zap, CheckCircle2,
} from "lucide-react";

// ─── BILLING DEFAULTS ────────────────────────────────────────────────────────

const DEFAULT_BILLING_STEPS = [
  { days_offset: -3, type: "pre_vencimento",  label: "D-3", desc: "Lembrete 3 dias antes" },
  { days_offset:  0, type: "vencimento",       label: "D0",  desc: "No dia do vencimento"  },
  { days_offset:  3, type: "pos_vencimento",   label: "D+3", desc: "Cobrança 3 dias depois"},
];

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name:                    z.string().min(3).max(256),
  phone:                   z.string().regex(/^\d{8,11}$/, "O telefone deve conter apenas números (8 a 11 dígitos)"),
  email:                   z.string().email("Email inválido").max(256).optional(),
  user_id:                 z.string(),
  due_at:                  z.union([z.string().datetime().transform((v) => new Date(v)), z.date()]),
  additional_info:         z.string().max(256).optional(),
  product_id:              z.string().optional(),
  template_id:             z.string().optional(),
  key_id:                  z.string().optional(),
  observacoes1:            z.string().max(256).optional(),
  observacoes2:            z.string().max(256).optional(),
  new_product_name:        z.string().optional(),
  new_product_value:       z.number().optional(),
  new_product_description: z.string().optional(),
  new_key_type:            z.string().optional(),
  new_key_value:           z.string().optional(),
  new_key_label:           z.string().optional(),
});

type FormValues = z.infer<typeof createSchema>;

// ─── SHARED STYLE TOKENS ─────────────────────────────────────────────────────

const INPUT_CLS  = "cobr-popup-input";
const LABEL_CLS  = "cobr-popup-label";

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      fontSize: 10, fontWeight: 700, color: "#3A5A50",
      textTransform: "uppercase", letterSpacing: 1.2,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      paddingBottom: "0.55rem", marginBottom: "0.85rem",
      fontFamily: "'Syne', sans-serif",
    }}>
      <Icon size={13} color="#00C896" />
      {title}
    </div>
  );
}

function ModeToggle({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: "0.85rem" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: "0.38rem 0.85rem", borderRadius: 7,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            border: `1px solid ${value === opt.value ? "rgba(0,200,150,0.3)" : "rgba(255,255,255,0.08)"}`,
            background: value === opt.value ? "rgba(0,200,150,0.1)" : "transparent",
            color: value === opt.value ? "#00C896" : "#5A7A70",
            transition: "all 0.15s",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface Props { onSuccess: () => void; }

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function PopupCreateClient({ onSuccess }: Props) {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [open, setOpen]               = useState(false);
  const [isPending, setIsPending]     = useState(false);
  const [productMode, setProductMode] = useState<"existing" | "new">("existing");
  const [pixMode, setPixMode]         = useState<"existing" | "new">("existing");
  const [templateMode, setTemplateMode] = useState<"existing" | "default">("existing");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [productValue, setProductValue] = useState<Product | undefined>();
  const [templateValue, setTemplateValue] = useState<MessageTemplate | undefined>();
  const [keyValue, setKeyValue]         = useState<PixKey | undefined>();
  const [billingEnabled, setBillingEnabled] = useState(true);
  const [preferredChannels, setPreferredChannels] = useState<string[]>(["whatsapp"]);
  const [recurrence, setRecurrence] = useState<"none" | "monthly">("none");
  const [consentimento, setConsentimento] = useState(false);

  // ── smart defaults ────────────────────────────────────────────────────────

  const { data: defaultsData } = useQuery({
    queryKey: ["smartDefaults", parsedUser?.id],
    queryFn: async () => {
      const [productsRes, keysRes, templatesRes] = await Promise.all([
        fetchUseQuery<undefined, ProductsResponse>({ route: "/products?limit=1", method: "GET" }),
        fetchUseQuery<undefined, PixKeysResponse>({ route: "/pix_keys?limit=1", method: "GET" }),
        fetchUseQuery<undefined, MessageTemplatesResponse>({ route: "/message_templates?limit=1", method: "GET" }),
      ]);
      return {
        product:  productsRes.products?.[0]   ?? null,
        key:      keysRes.keys?.[0]            ?? null,
        template: templatesRes.templates?.[0]  ?? null,
      };
    },
    enabled: open && !!parsedUser?.id,
    staleTime: 30_000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "", phone: "", email: undefined, due_at: new Date(),
      additional_info: undefined, user_id: parsedUser?.id,
      product_id: "", template_id: "", key_id: "",
      observacoes1: "", observacoes2: "",
      new_product_name: "", new_product_value: undefined,
      new_product_description: undefined, new_key_type: "",
      new_key_value: "", new_key_label: undefined,
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (!defaultsData) return;
    if (defaultsData.product && !form.getValues("product_id")) {
      form.setValue("product_id", defaultsData.product.id);
      setProductValue(defaultsData.product);
    }
    if (defaultsData.key && !form.getValues("key_id")) {
      form.setValue("key_id", defaultsData.key.id);
      setKeyValue(defaultsData.key);
    }
    if (defaultsData.template && !form.getValues("template_id")) {
      form.setValue("template_id", defaultsData.template.id);
      setTemplateValue(defaultsData.template);
    }
  }, [defaultsData]);

  function resetAllState() {
    setProductMode("existing"); setPixMode("existing");
    setTemplateMode("existing"); setAdvancedOpen(false);
    setProductValue(undefined); setTemplateValue(undefined); setKeyValue(undefined);
    setBillingEnabled(true); setPreferredChannels(["whatsapp"]); setRecurrence("none"); setConsentimento(false);
    reset({
      name: "", phone: "", email: undefined, due_at: new Date(),
      additional_info: undefined, user_id: parsedUser?.id,
      product_id: "", template_id: "", key_id: "",
      observacoes1: "", observacoes2: "",
      new_product_name: "", new_product_value: undefined,
      new_product_description: undefined, new_key_type: "",
      new_key_value: "", new_key_label: undefined,
    });
  }

  useEffect(() => { if (!open) resetAllState(); }, [open]);

  const keyTypes = [
    { value: "CPF",       label: "CPF"       },
    { value: "CNPJ",      label: "CNPJ"      },
    { value: "EMAIL",     label: "E-mail"    },
    { value: "TELEFONE",  label: "Telefone"  },
    { value: "ALEATORIA", label: "Aleatória" },
  ];

  // ── submit ────────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setIsPending(true);
    try {
      let productId = values.product_id;

      if (productMode === "new") {
        if (!values.new_product_name || values.new_product_name.length < 3) {
          toast.error("Nome do produto deve ter ao menos 3 caracteres."); setIsPending(false); return;
        }
        if (!values.new_product_value || values.new_product_value < 0.01) {
          toast.error("Valor do produto deve ser maior que 0."); setIsPending(false); return;
        }
        const newProduct = await fetchUseQuery<Record<string, unknown>, Product>({
          route: "/products", method: "POST",
          data: { name: values.new_product_name, value: values.new_product_value, description: values.new_product_description || undefined, user_id: parsedUser?.id },
        });
        productId = newProduct.id;
      }

      let keyId = values.key_id;

      if (advancedOpen && pixMode === "new") {
        if (!values.new_key_type)  { toast.error("Selecione o tipo da chave PIX."); setIsPending(false); return; }
        if (!values.new_key_value) { toast.error("Informe o valor da chave PIX.");  setIsPending(false); return; }
        const newKey = await fetchUseQuery<Record<string, unknown>, PixKey>({
          route: "/pix_keys", method: "POST",
          data: { key_type: values.new_key_type, key_value: values.new_key_value, label: values.new_key_label || undefined, user_id: parsedUser?.id },
        });
        keyId = newKey.id;
      }

      const payload: Record<string, unknown> = {
        name: values.name, phone: values.phone, email: values.email || undefined,
        due_at: values.due_at, user_id: parsedUser?.id,
        product_id: productId, key_id: keyId || undefined,
        observacoes1: values.observacoes1 || undefined,
        observacoes2: values.observacoes2 || undefined,
        preferred_channels: preferredChannels,
      };
      if (templateMode === "existing" && values.template_id) payload.template_id = values.template_id;

      const newClient = await fetchUseQuery<typeof payload, CreateClientData>({ route: "/clients", method: "POST", data: payload });

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
                  ? "Olá, {nome}! 👋\n\nSeu pagamento de {valor} vence em {vencimento}.\n\n💳 Pix: {chave_pix}\n\nQualquer dúvida, estamos à disposição!"
                  : s.days_offset === 0
                  ? "Olá, {nome}! 📅\n\nHoje é dia de pagamento!\n\nValor: {valor}\n🔑 Chave Pix: {chave_pix}\n\nSe já pagou, pode ignorar esta mensagem."
                  : "Olá, {nome}! ⚠️\n\nSeu pagamento de {valor} (vencimento: {vencimento}) está em atraso.\n\n🔑 Chave Pix: {chave_pix}\n\nApós o pagamento, envie o comprovante.",
              })),
            },
          });
        } catch {
          // régua falhou mas cliente foi criado — não bloqueia o fluxo
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
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          color: #F0F5F2 !important;
          font-size: 13px !important;
          font-family: 'DM Sans', sans-serif !important;
          height: 40px !important;
          transition: border-color 0.2s !important;
        }
        .cobr-popup-input:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
          outline: none !important;
        }
        .cobr-popup-input::placeholder { color: #2A4A40 !important; }
        .cobr-popup-input:disabled { opacity: 0.5 !important; }

        .cobr-popup-textarea {
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          color: #F0F5F2 !important;
          font-size: 13px !important;
          font-family: 'DM Sans', sans-serif !important;
          resize: vertical !important;
          transition: border-color 0.2s !important;
        }
        .cobr-popup-textarea:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
          outline: none !important;
        }
        .cobr-popup-textarea::placeholder { color: #2A4A40 !important; }

        .cobr-popup-label {
          font-size: 12px !important;
          font-weight: 500 !important;
          color: #7A9087 !important;
          margin-bottom: 4px !important;
        }

        .cobr-popup-hint {
          font-size: 11px;
          color: #3A5A50;
          margin-top: 4px;
        }

        /* calendar trigger button */
        .cobr-cal-btn {
          width: 100%; height: 40px;
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          color: #F0F5F2 !important;
          font-size: 13px !important;
          font-family: 'DM Sans', sans-serif !important;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 12px; cursor: pointer;
          transition: border-color 0.2s;
        }
        .cobr-cal-btn:hover { border-color: rgba(0,200,150,0.3) !important; }
        .cobr-cal-btn.empty { color: #2A4A40 !important; }

        /* advanced toggle */
        .cobr-adv-toggle {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 600; color: #4A6A60;
          font-family: 'DM Sans', sans-serif;
          padding: 0.5rem 0; transition: color 0.15s;
        }
        .cobr-adv-toggle:hover { color: #00C896; }

        /* submit btn */
        .cobr-submit {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: #00C896 !important; color: #051A12 !important;
          border: none !important; border-radius: 8px !important;
          padding: 0.7rem 1.5rem !important;
          font-family: 'Syne', sans-serif !important;
          font-size: 0.88rem !important; font-weight: 700 !important;
          cursor: pointer !important; transition: background 0.2s !important;
          width: 100% !important;
        }
        .cobr-submit:hover:not(:disabled) { background: #00A87E !important; }
        .cobr-submit:disabled { opacity: 0.65 !important; cursor: not-allowed !important; }

        /* divider */
        .cobr-section-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0.25rem 0 1rem; }

        /* trigger btn */
        .cobr-trigger-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #00C896; color: #051A12; border: none;
          border-radius: 8px; padding: 0.6rem 1.1rem;
          font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; transition: background 0.2s;
        }
        .cobr-trigger-btn:hover { background: #00A87E; }
      `}</style>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="cobr-trigger-btn">
            <Plus size={14} /> Nova Cobrança
          </button>
        </DialogTrigger>

        <DialogContent style={{
          background: "#0D1210",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          maxWidth: 620,
          maxHeight: "92vh",
          overflowY: "auto",
          fontFamily: "'DM Sans', sans-serif",
          color: "#F0F5F2",
        }}>
          <DialogHeader style={{ marginBottom: "0.25rem" }}>
            <DialogTitle style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#F0F5F2", letterSpacing: -0.3 }}>
              Nova Cobrança
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} onSubmit={form.handleSubmit(onSubmit)}>

              {/* ── SECTION 1: CLIENTE ── */}
              <div>
                <SectionHeader icon={Users} title="Cliente" />

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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
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
                              <button
                                type="button"
                                className={cn("cobr-cal-btn", !field.value && "empty")}
                              >
                                <span>{field.value ? format(field.value, "dd/MM/yyyy") : "Selecione uma data"}</span>
                                <CalendarIcon size={14} style={{ color: "#3A5A50" }} />
                              </button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent align="start" style={{ padding: 0, background: "#0D1210", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
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
                              style={{ width: "100%", padding: "0.5rem", background: "none", border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", color: "#5A7A70", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
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
              </div>

              {/* ── SECTION 2: PRODUTO ── */}
              <div>
                <SectionHeader icon={Package} title="Produto" />

                <ModeToggle
                  options={[{ value: "existing", label: "Selecionar existente" }, { value: "new", label: "Criar novo" }]}
                  value={productMode}
                  onChange={(v) => setProductMode(v as "existing" | "new")}
                />

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
                    <FormField
                      control={form.control}
                      name="new_product_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={LABEL_CLS}>Nome do produto <span style={{ color: "#E84545" }}>*</span></FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* ── SECTION 3: ADVANCED ── */}
              <div>
                <button
                  type="button"
                  className="cobr-adv-toggle"
                  onClick={() => setAdvancedOpen((p) => !p)}
                >
                  {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Configurações avançadas
                </button>

                {advancedOpen && (
                  <div style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                    {/* Chave PIX */}
                    <div>
                      <SectionHeader icon={CreditCard} title="Chave PIX" />
                      <ModeToggle
                        options={[{ value: "existing", label: "Selecionar existente" }, { value: "new", label: "Criar nova" }]}
                        value={pixMode}
                        onChange={(v) => setPixMode(v as "existing" | "new")}
                      />

                      {pixMode === "existing" && (
                        <FormField
                          control={form.control}
                          name="key_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={LABEL_CLS}>Chave PIX</FormLabel>
                              <FormControl>
                                <ComboboxDebounce
                                  route="/pix_keys?name"
                                  queryKey="keysQueryKey"
                                  dataField="keys"
                                  placeholderInputSearch="Busque por nome"
                                  placeholderUnselected="Selecione o PIX"
                                  selecionado={field.value as unknown as PixKey[] ?? keyValue as PixKey}
                                  setSelecionado={(value) => { const b = value as unknown as PixKey; field.onChange(b.id); setKeyValue(b); }}
                                  selectedField={(s: PixKey) => s?.key_value}
                                  renderOption={(d) => <span key={(d as unknown as PixKey).id}>{typeof d === "string" ? d : (d as PixKey)?.key_value}</span>}
                                  visualizacao={keyValue?.key_value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {pixMode === "new" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                          <FormField
                            control={form.control}
                            name="new_key_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={LABEL_CLS}>Tipo de chave <span style={{ color: "#E84545" }}>*</span></FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={(v) => field.onChange(v === "" ? undefined : v)}>
                                    <SelectTrigger style={{ background: "#111614", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#F0F5F2", height: 40, fontSize: 13 }}>
                                      <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent style={{ background: "#0D1210", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
                                      {keyTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_key_value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={LABEL_CLS}>Valor da chave <span style={{ color: "#E84545" }}>*</span></FormLabel>
                                <FormControl><Input className={INPUT_CLS} placeholder="Digite a chave PIX" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="new_key_label"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={LABEL_CLS}>Identificação (opcional)</FormLabel>
                                <FormControl>
                                  <Input
                                    className={INPUT_CLS}
                                    placeholder="Ex.: Chave principal"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Template */}
                    <div>
                      <SectionHeader icon={MessageSquare} title="Template de mensagem" />
                      <ModeToggle
                        options={[{ value: "existing", label: "Selecionar existente" }, { value: "default", label: "Usar padrão" }]}
                        value={templateMode}
                        onChange={(v) => {
                          setTemplateMode(v as "existing" | "default");
                          if (v === "default") form.setValue("template_id", "");
                        }}
                      />
                      {templateMode === "existing" && (
                        <FormField
                          control={form.control}
                          name="template_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={LABEL_CLS}>Template</FormLabel>
                              <FormControl>
                                <ComboboxDebounce
                                  route="/message_templates?name"
                                  queryKey="templatesQueryKey"
                                  dataField="templates"
                                  placeholderInputSearch="Busque por nome"
                                  placeholderUnselected="Selecione a template"
                                  selecionado={field.value as unknown as MessageTemplate[] ?? templateValue as MessageTemplate}
                                  setSelecionado={(value) => { const b = value as unknown as MessageTemplate; field.onChange(b.id); setTemplateValue(b); }}
                                  selectedField={(s: MessageTemplate) => s?.name}
                                  renderOption={(d) => <span key={(d as unknown as MessageTemplate).id}>{typeof d === "string" ? d : (d as MessageTemplate)?.name}</span>}
                                  visualizacao={templateValue?.name}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {templateMode === "default" && (
                        <p style={{ fontSize: 12, color: "#4A6A60" }}>Será usado o template padrão do sistema.</p>
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
                            <FormMessage />
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── RÉGUA DE COBRANÇA ── */}
              <div style={{
                border: `1px solid ${billingEnabled ? "rgba(0,200,150,0.2)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12,
                background: billingEnabled ? "rgba(0,200,150,0.03)" : "rgba(255,255,255,0.01)",
                padding: "14px 16px",
                transition: "all 0.2s",
              }}>
                {/* header da seção */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: billingEnabled ? 14 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* <Zap size={14} color={billingEnabled ? "#00C896" : "#3A5A50"} /> */}
                    <span style={{ fontSize: 13, fontWeight: 600, color: billingEnabled ? "#C0D5CC" : "#3A5A50" }}>
                      Régua de cobrança automática
                    </span>
                  </div>
                  {/* toggle */}
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
                    <p style={{ fontSize: 11, color: "#3A5A50", margin: "0 0 12px" }}>
                      Mensagens automáticas serão enviadas nos seguintes momentos:
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                      {DEFAULT_BILLING_STEPS.map((step, i) => (
                        <div key={step.days_offset} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                            <div style={{
                              width: 34, height: 34, borderRadius: "50%",
                              background: step.days_offset === 0 ? "rgba(0,200,150,0.15)" : "rgba(255,255,255,0.04)",
                              border: `2px solid ${step.days_offset === 0 ? "#00C896" : "rgba(255,255,255,0.12)"}`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <CheckCircle2 size={14} color={step.days_offset === 0 ? "#00C896" : "#3A5A50"} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: step.days_offset === 0 ? "#00C896" : "#5A7A70" }}>
                              {step.label}
                            </span>
                            <span style={{ fontSize: 10, color: "#3A5A50", textAlign: "center", lineHeight: 1.3 }}>
                              {step.desc}
                            </span>
                          </div>
                          {i < DEFAULT_BILLING_STEPS.length - 1 && (
                            <div style={{ height: 1, width: 20, background: "rgba(255,255,255,0.07)", marginBottom: 20, flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Canal de envio */}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ fontSize: 11, color: "#5A7A70", marginBottom: 8, fontWeight: 600 }}>Canais de envio:</p>
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
                              onClick={() => setPreferredChannels(prev =>
                                active
                                  ? prev.filter(c => c !== key)
                                  : [...prev, key]
                              )}
                              style={{
                                padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.15s",
                                border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`,
                                background: active ? color + "18" : "transparent",
                                color: active ? color : "#3A5A50",
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recorrência */}
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <p style={{ fontSize: 11, color: "#5A7A70", marginBottom: 8, fontWeight: 600 }}>Recorrência:</p>
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
                                color: active ? "#00C896" : "#3A5A50",
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {recurrence === "monthly" && (
                        <p style={{ fontSize: 10, color: "#3A5A50", marginTop: 6 }}>
                          Nova régua gerada automaticamente todo mês após o ciclo ser concluído.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── CONSENT CHECKBOX ── */}
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: "rgba(0,0,0,0.15)", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                <input 
                  type="checkbox" 
                  checked={consentimento} 
                  onChange={(e) => setConsentimento(e.target.checked)} 
                  style={{ marginTop: 2, accentColor: "#00C896", width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} 
                />
                <span style={{ fontSize: 12, color: "#9AA5A0", lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
                  Declaro que possuo o <strong>consentimento expresso</strong> deste cliente para cadastrar seus dados pessoais e enviar comunicações via e-mail, SMS ou WhatsApp.
                </span>
              </label>

              {/* ── SUBMIT ── */}
              <ButtonLoading isLoading={isPending} disabled={!consentimento || isPending} type="submit" className="cobr-submit">
                Criar Cobrança
              </ButtonLoading>

            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}