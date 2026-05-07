import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ClientSchemas } from "@/schemas/ClientSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon, Pencil, Zap, CheckCircle2,
  AlertCircle, Clock, Settings, ChevronDown, ChevronUp, History, Link2,
} from "lucide-react";
import { BillingRulesDialog } from "./BillingRulesDialog";
import ComboboxDebounce from "../ComboboxDebounce";
import { Product } from "@/api/models/products";
import SpinnerLoading from "../SpinnerLoading";
import { mascaraTelefone } from "@/utils/mask";
import { Client } from "@/api/models/clients";
import { PixKey } from "@/api/models/pixKeys";
import ButtonLoading from "../ButtonLoading";
import { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_BILLING_STEPS = [
  { days_offset: -3, type: "pre_vencimento", label: "D-3", desc: "3 dias antes" },
  { days_offset: 0, type: "vencimento", label: "D0", desc: "No vencimento" },
  { days_offset: 3, type: "pos_vencimento", label: "D+3", desc: "3 dias depois" },
];

interface Props { id: string; onSuccess: () => void; }

interface BillingStats {
  total: number; sent: number; failed: number; scheduled: number; is_active: boolean; recurrence?: string; payment_link?: string | null;
}

interface CycleRule {
  id: string; type: string; days_offset: number; status: string;
  scheduled_at: string; sent_at: string | null; error_message: string | null; subject: string | null;
}

interface BillingCycle {
  id: string; due_at: string; due_at_full: string; status: string; created_at: string;
  rules: CycleRule[];
  summary: { total: number; sent: number; failed: number; scheduled: number; cancelled: number };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function PopupAlterClient({ id, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [creatingBilling, setCreatingBilling] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [productValue, setProductValue] = useState<Product>(null);
  const [keyValue, setKeyValue] = useState<PixKey>(null);
  const [preferredChannels, setPreferredChannels] = useState<string[]>(["whatsapp"]);
  const [recurrence, setRecurrence] = useState<"none" | "monthly">("none");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ── billing stats ─────────────────────────────────────────────────────────

  const { data: billingStats, refetch: refetchBilling } = useQuery<BillingStats | null>({
    queryKey: ["billingStats", id],
    queryFn: async () => {
      try {
        return await fetchUseQuery<undefined, BillingStats>({ route: `/billing/stats/${id}`, method: "GET" });
      } catch { return null; }
    },
    enabled: open && !!id,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const hasBilling = billingStats && billingStats.total > 0;

  const { data: cycles } = useQuery<BillingCycle[]>({
    queryKey: ["billingCycles", id],
    queryFn: async () => {
      try {
        const res = await fetchUseQuery<undefined, { data: BillingCycle[] }>({ route: `/billing/cycles/${id}`, method: "GET" });
        return res.data ?? [];
      } catch { return []; }
    },
    enabled: open && !!id && historyOpen,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  async function handleCreateBilling() {
    setCreatingBilling(true);
    try {
      await fetchUseQuery<any, any>({
        route: `/billing/rules/${id}`,
        method: "POST",
        data: {
          useDefaultTemplates: false,
          recurrence,
          templates: DEFAULT_BILLING_STEPS.map((s) => ({
            type: s.type,
            days_offset: s.days_offset,
            subject: s.days_offset < 0
              ? "Lembrete de pagamento - {nome}"
              : s.days_offset === 0
                ? "Pagamento hoje - {nome}"
                : "Pagamento em atraso - {nome}",
            content: s.days_offset < 0
              ? "Olá, {nome}! 👋\n\nSeu pagamento de {valor} vence em {vencimento}.\n\nVocê pode pagar via PIX ou Cartão acessando seu link exclusivo:\n🔗 {link_pagamento}"
              : s.days_offset === 0
                ? "Olá, {nome}! 📅\n\nHoje é dia de pagamento!\n\nValor: {valor}\n\nPague agora pelo link seguro:\n🔗 {link_pagamento}"
                : "Olá, {nome}! ⚠️\n\nSeu pagamento de {valor} está em atraso.\n\nAcesse seu link para regularizar:\n🔗 {link_pagamento}",
          })),
        },
      });
      toast.success("Régua de cobrança ativada!");
      refetchBilling();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar régua. Verifique se o cliente tem data de vencimento.");
    } finally {
      setCreatingBilling(false);
    }
  }

  // ── client data ───────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<Client>({
    queryKey: ["getClient", id],
    queryFn: async () =>
      fetchUseQuery<undefined, Client>({ route: `/clients/${id}`, method: "GET" }),
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: open && !!id,
  });

  const schema = ClientSchemas.alter;
  const formClient = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", email: undefined, due_at: new Date(),
      additional_info: undefined, product_id: "",
      key_id: "", observacoes1: "", observacoes2: "",
    },
  });

  const { reset } = formClient;

  useEffect(() => {
    if (data) {
      reset({
        name: data?.name ?? "", phone: data?.phone ?? "",
        email: data?.email ?? undefined, due_at: data?.due_at ?? new Date(),
        additional_info: data?.additional_info ?? undefined,
        product_id: data?.product_id ?? "",
        key_id: data?.key_id ?? "", user_id: data?.user_id,
        observacoes1: data?.observacoes1 ?? "", observacoes2: data?.observacoes2 ?? "",
      });
      setProductValue(data?.product ? { ...data.product } : null);
      setKeyValue(data?.key ? { ...data.key } : null);
      if (Array.isArray((data as any)?.preferred_channels) && (data as any).preferred_channels.length > 0) {
        setPreferredChannels((data as any).preferred_channels);
      }
      if ((data as any)?.billing_template?.recurrence) {
        setRecurrence((data as any).billing_template.recurrence === "monthly" ? "monthly" : "none");
      }
    }
  }, [data, reset]);

  // Update recurrence when it changes
  const updateRecurrenceMutation = useMutation({
    mutationFn: async (newRecurrence: "none" | "monthly") =>
      fetchUseQuery<any, any>({ route: `/billing/recurrence/${id}`, method: "PATCH", data: { recurrence: newRecurrence } }),
    onSuccess: () => {
      toast.success("Recorrência atualizada!");
      refetchBilling();
    },
    onError: (error: ApiErrorQuery) => {
      toast.error("Erro ao atualizar recorrência");
    },
  });

  const handleRecurrenceChange = (newRecurrence: "none" | "monthly") => {
    setRecurrence(newRecurrence);
    if (hasBilling) {
      updateRecurrenceMutation.mutate(newRecurrence);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) =>
      fetchUseQuery<any, Client>({ route: `/clients/${id}`, method: "PATCH", data: { ...data, preferred_channels: preferredChannels } }),
    onSuccess: async () => {
      toast.success("Cliente alterado com sucesso!");
      setOpen(false); reset(); onSuccess();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  // ── render ────────────────────────────────────────────────────────────────

  const LABEL: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: "#475569", marginBottom: 4, display: "block",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .alter-input {
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important; color: #0F172A !important;
          font-size: 13px !important; font-family:  "Montserrat", sans-serif !important;
          height: 40px !important; transition: border-color 0.2s !important;
        }
        .alter-input:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; outline: none !important;
        }
        .alter-input::placeholder { color: #94A3B8 !important; }
        .alter-textarea {
          background: #FFFFFF !important; border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important; color: #0F172A !important;
          font-size: 13px !important; font-family:  "Montserrat", sans-serif !important;
          resize: vertical !important; transition: border-color 0.2s !important;
        }
        .alter-textarea:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; outline: none !important;
        }
        .alter-textarea::placeholder { color: #94A3B8 !important; }
        .alter-cal-btn {
          width: 100%; height: 40px;
          background: #FFFFFF !important; border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important; color: #0F172A !important;
          font-size: 13px !important; font-family:  "Montserrat", sans-serif !important;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 12px; cursor: pointer; transition: border-color 0.2s;
        }
        .alter-cal-btn:hover { border-color: rgba(0,200,150,0.3) !important; }
        .alter-cal-btn.empty { color: #94A3B8 !important; }
        .alter-submit {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: #00C896 !important; color: #FFFFFF !important;
          border: none !important; border-radius: 8px !important;
          padding: 0.7rem 1.5rem !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.88rem !important; font-weight: 700 !important;
          cursor: pointer !important; transition: background 0.2s !important;
          width: 100% !important;
        }
        .alter-submit:hover:not(:disabled) { background: #00A87E !important; }
        .alter-submit:disabled { opacity: 0.65 !important; cursor: not-allowed !important; }
        .alter-trigger {
          background: none; border: 1px solid #E2E8F0;
          color: #64748B; border-radius: 7px; padding: 5px 7px;
          cursor: pointer; display: inline-flex; align-items: center;
          transition: border-color 0.15s, color 0.15s;
        }
        .alter-trigger:hover { border-color: rgba(0,200,150,0.3); color: #00C896; }
        .alter-divider { height: 1px; background: #F1F5F9; margin: 0.25rem 0; }
        .alter-section-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 700; color: #64748B;
          text-transform: uppercase; letter-spacing: 1.2px;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 0.5rem; margin-bottom: 0.85rem;
          font-family: 'Montserrat', sans-serif;
        }
        .alter-hint { font-size: 11px; color: #94A3B8; margin-top: 4px; }
      `}</style>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="alter-trigger" title="Editar cliente">
            <Pencil size={13} />
          </button>
        </DialogTrigger>

        <DialogContent style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 18,
          maxWidth: 620,
          maxHeight: "92vh",
          overflowY: "auto",
          fontFamily: " 'Montserrat', sans-serif",
          color: "#0F172A",
        }}>
          <DialogHeader style={{ marginBottom: "0.25rem" }}>
            <DialogTitle style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", letterSpacing: -0.3 }}>
              Editar Cobrança
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <SpinnerLoading />
            </div>
          ) : (
            <Form {...formClient}>
              <form
                style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
                onSubmit={formClient.handleSubmit((data) => mutate(data))}
              >

                {/* ── CLIENTE ── */}
                <div>
                  <div className="alter-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    Cliente
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <FormField
                      control={formClient.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>Nome <span style={{ color: "#E84545" }}>*</span></FormLabel>
                          <FormControl>
                            <Input className="alter-input" placeholder="Nome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={formClient.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>Telefone <span style={{ color: "#E84545" }}>*</span></FormLabel>
                          <FormControl>
                            <Input
                              className="alter-input"
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
                          <p className="alter-hint">DDD + 9 dígitos. Ex.: 69 9XXXX-XXXX</p>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div style={{ marginTop: "0.75rem" }}>
                    <FormField
                      control={formClient.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>E-mail (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              className="alter-input"
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
                  </div>
                </div>

                {/* ── VÍNCULOS ── */}
                <div>
                  <div className="alter-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                    Vínculos
                  </div>

                  <FormField
                    control={formClient.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={LABEL}>Produto <span style={{ color: "#E84545" }}>*</span></FormLabel>
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

                  {/* Tax info — read-only, shown when product has fees configured */}
                  {productValue && (productValue.late_fee_percent || productValue.late_interest_percent) && (
                    <div style={{
                      marginTop: "0.65rem",
                      border: "1px solid #F1F5F9",
                      borderRadius: 8,
                      padding: "10px 12px",
                      background: "#F8FAFC",
                      display: "flex", gap: 16, alignItems: "center",
                    }}>
                      <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.6, flexShrink: 0 }}>
                        Taxa de atraso
                      </span>
                      {productValue.late_fee_percent != null && (
                        <span style={{ fontSize: 12, color: "#475569" }}>
                          Multa: <strong style={{ color: "#0F172A" }}>{productValue.late_fee_percent}%</strong>
                          <span style={{ fontSize: 10, color: "#64748B", marginLeft: 4 }}>(D+1)</span>
                        </span>
                      )}
                      {productValue.late_interest_percent != null && (
                        <span style={{ fontSize: 12, color: "#475569" }}>
                          Juros: <strong style={{ color: "#0F172A" }}>{productValue.late_interest_percent}%</strong>
                          <span style={{ fontSize: 10, color: "#64748B", marginLeft: 4 }}>/mês</span>
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "#64748B", marginLeft: "auto" }}>
                        Edite em Configurações → Produtos
                      </span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                    <FormField
                      control={formClient.control}
                      name="key_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>Chave PIX <span style={{ color: "#E84545" }}>*</span></FormLabel>
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

                    <FormField
                      control={formClient.control}
                      name="due_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>Vencimento <span style={{ color: "#E84545" }}>*</span></FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <button
                                  type="button"
                                  className={cn("alter-cal-btn", !field.value && "empty")}
                                >
                                  <span>{field.value ? format(field.value, "dd/MM/yyyy") : "Selecione uma data"}</span>
                                  <CalendarIcon size={14} style={{ color: "#3A5A50" }} />
                                </button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              style={{ 
                                padding: 0, 
                                background: "#FFFFFF", 
                                border: "1px solid #E2E8F0", 
                                borderRadius: 12,
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                              }}
                            >
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
                                style={{ width: "100%", padding: "0.5rem", background: "none", border: "none", borderTop: "1px solid #F1F5F9", color: "#64748B", fontSize: 12, cursor: "pointer", fontFamily: " 'Montserrat', sans-serif" }}
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

                {/* ── OBSERVAÇÕES ── */}
                <div>
                  <div className="alter-section-title">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C896" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    Observações
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <FormField
                      control={formClient.control}
                      name="observacoes1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>Observações 1 (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              className="alter-textarea"
                              rows={2}
                              placeholder="Observações relacionadas a este cliente..."
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={formClient.control}
                      name="observacoes2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={LABEL}>Observações 2 (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              className="alter-textarea"
                              rows={2}
                              placeholder="Observações relacionadas a este cliente..."
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

                {/* ── RÉGUA DE COBRANÇA ── */}
                <div>
                  <div className="alter-section-title">
                    <Zap size={13} color="#00C896" />
                    Régua de cobrança
                  </div>

                  <div style={{
                    border: `1px solid ${hasBilling ? "rgba(0,200,150,0.2)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12,
                    background: hasBilling ? "rgba(0,200,150,0.03)" : "rgba(255,255,255,0.01)",
                    padding: "0.9rem 1rem",
                  }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {/* <Zap size={13} color={hasBilling ? "#00C896" : "#3A5A50"} /> */}
                        <span style={{ fontSize: 13, fontWeight: 600, color: hasBilling ? "#C0D5CC" : "#5A7A70", fontFamily: "'Montserrat', sans-serif" }}>
                          {hasBilling ? "Régua Ativa" : "Sem régua configurada"}
                        </span>
                      </div>

                      {hasBilling ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {billingStats.failed > 0 ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#E84545", fontWeight: 600 }}>
                              <AlertCircle size={11} /> {billingStats.failed} falha{billingStats.failed > 1 ? "s" : ""}
                            </span>
                          ) : billingStats.scheduled > 0 ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>
                              <Clock size={11} /> {billingStats.scheduled} agendamento{billingStats.scheduled > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#00C896", fontWeight: 600 }}>
                              <CheckCircle2 size={11} /> {billingStats.sent}/{billingStats.total} enviadas
                            </span>
                          )}
                          {!billingStats.is_active && (
                            <span style={{ fontSize: 10, color: "#F5A623", fontWeight: 700, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 100, padding: "2px 8px" }}>
                              Pausada
                            </span>
                          )}
                          {billingStats.recurrence === "monthly" && (
                            <span style={{ fontSize: 10, color: "#00C896", fontWeight: 700, background: "rgba(0,200,150,0.08)", border: "1px solid rgba(0,200,150,0.2)", borderRadius: 100, padding: "2px 8px" }}>
                              Mensal
                            </span>
                          )}
                          {/* <button
                            type="button"
                            onClick={() => setBillingDialogOpen(true)}
                            style={{
                              background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                              color: "#818CF8", borderRadius: 7, padding: "4px 10px",
                              fontSize: 11, fontWeight: 600, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: 4,
                            }}
                          >
                            <Settings size={11} /> Editar
                          </button> */}
                          {billingStats.payment_link && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(billingStats.payment_link!);
                                setCopiedLink(true);
                                setTimeout(() => setCopiedLink(false), 2500);
                              }}
                              style={{
                                background: copiedLink ? "rgba(0,200,150,0.1)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${copiedLink ? "rgba(0,200,150,0.25)" : "rgba(255,255,255,0.08)"}`,
                                color: copiedLink ? "#00C896" : "#5A7A70",
                                borderRadius: 7, padding: "4px 10px",
                                fontSize: 11, fontWeight: 600, cursor: "pointer",
                                display: "inline-flex", alignItems: "center", gap: 4,
                                transition: "all 0.15s",
                              }}
                            >
                              {copiedLink ? <><CheckCircle2 size={11} /> Copiado!</> : <><Link2 size={11} /> Copiar Link</>}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={creatingBilling}
                          onClick={handleCreateBilling}
                          style={{
                            background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.2)",
                            color: "#00C896", borderRadius: 8, padding: "5px 12px",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            opacity: creatingBilling ? 0.6 : 1,
                            fontFamily: "'Montserrat', sans-serif",
                          }}
                        >
                          {creatingBilling ? "Ativando..." : "+ Ativar régua"}
                        </button>
                      )}
                    </div>

                    {/* Timeline */}
                    {hasBilling && (
                      <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
                        {DEFAULT_BILLING_STEPS.map((step, i) => (
                          <div key={step.days_offset} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: "50%",
                                background: step.days_offset === 0 ? "rgba(0,200,150,0.1)" : "#F1F5F9",
                                border: `2px solid ${step.days_offset === 0 ? "#00C896" : "#E2E8F0"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                <CheckCircle2 size={12} color={step.days_offset === 0 ? "#00C896" : "#94A3B8"} />
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: step.days_offset === 0 ? "#00C896" : "#64748B", fontFamily: "'Montserrat', sans-serif" }}>
                                {step.label}
                              </span>
                              <span style={{ fontSize: 10, color: "#64748B", textAlign: "center" }}>{step.desc}</span>
                            </div>
                            {i < DEFAULT_BILLING_STEPS.length - 1 && (
                              <div style={{ height: 1, width: 16, background: "#E2E8F0", marginBottom: 20, flexShrink: 0 }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Canais de envio */}
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                      <p style={{ fontSize: 11, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>Canais de envio:</p>
                      <div style={{ display: "flex", gap: 6 }}>
                        {([
                          { key: "whatsapp", label: "WhatsApp", color: "#25D366" },
                          { key: "email", label: "E-mail", color: "#6366f1" },
                          { key: "sms", label: "SMS", color: "#F5A623" },
                        ] as const).map(({ key, label, color }) => {
                          const active = preferredChannels.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setPreferredChannels(prev =>
                                active ? prev.filter(c => c !== key) : [...prev, key]
                              )}
                              style={{
                                padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.15s",
                                border: `1px solid ${active ? color + "55" : "#E2E8F0"}`,
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
                          { value: "none", label: "Único" },
                          { value: "monthly", label: "Mensal" },
                        ] as const).map(({ value, label }) => {
                          const active = recurrence === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleRecurrenceChange(value)}
                              disabled={updateRecurrenceMutation.isPending}
                              style={{
                                padding: "4px 14px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                                cursor: updateRecurrenceMutation.isPending ? "wait" : "pointer", transition: "all 0.15s",
                                border: `1px solid ${active ? "rgba(0,200,150,0.35)" : "#E2E8F0"}`,
                                background: active ? "rgba(0,200,150,0.12)" : "transparent",
                                color: active ? "#00C896" : "#64748B",
                                opacity: updateRecurrenceMutation.isPending ? 0.6 : 1,
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
                </div>

                {/* ── HISTÓRICO DE CICLOS ── */}
                {hasBilling && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(v => !v)}
                      style={{
                        display: "flex", alignItems: "center", gap: 7, width: "100%",
                        background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0",
                        fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase",
                        letterSpacing: 1.1, fontFamily: "'Montserrat', sans-serif",
                        borderBottom: historyOpen ? "1px solid #F1F5F9" : "none",
                        marginBottom: historyOpen ? "0.75rem" : 0,
                      }}
                    >
                      <History size={12} color="#64748B" />
                      Histórico de cobranças
                      {historyOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>

                    {historyOpen && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {!cycles || cycles.length === 0 ? (
                          <p style={{ fontSize: 12, color: "#64748B", textAlign: "center", padding: "1rem 0" }}>
                            Nenhum ciclo encontrado ainda.
                          </p>
                        ) : cycles.map(cycle => (
                          <div key={cycle.id} style={{
                            border: "1px solid #F1F5F9",
                            borderRadius: 10,
                            overflow: "hidden",
                          }}>
                            {/* cycle header */}
                            <div style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "8px 12px",
                              background: cycle.status === 'completed' ? "rgba(0,200,150,0.05)" : "#F8FAFC",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", fontFamily: "'Montserrat', sans-serif" }}>
                                  {cycle.due_at}
                                </span>
                                <span style={{ fontSize: 10, color: "#64748B" }}>venc. {cycle.due_at_full}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 10, color: "#00C896", fontWeight: 600 }}>
                                  {cycle.summary.sent}/{cycle.summary.total} enviadas
                                </span>
                                {cycle.summary.failed > 0 && (
                                  <span style={{ fontSize: 10, color: "#E84545", fontWeight: 600 }}>
                                    {cycle.summary.failed} falha{cycle.summary.failed > 1 ? 's' : ''}
                                  </span>
                                )}
                                <span style={{
                                  fontSize: 9, fontWeight: 700, borderRadius: 100, padding: "2px 7px",
                                  background: cycle.status === 'completed' ? "rgba(0,200,150,0.12)" : "rgba(99,102,241,0.12)",
                                  color: cycle.status === 'completed' ? "#00C896" : "#818CF8",
                                  border: `1px solid ${cycle.status === 'completed' ? "rgba(0,200,150,0.2)" : "rgba(99,102,241,0.2)"}`,
                                }}>
                                  {cycle.status === 'completed' ? 'Concluído' : 'Em andamento'}
                                </span>
                              </div>
                            </div>

                            {/* cycle rules */}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {cycle.rules.map((r, i) => (
                                <div key={r.id} style={{
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                  padding: "6px 12px",
                                  borderTop: i > 0 ? "1px solid #F1F5F9" : undefined,
                                }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{
                                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                                      background: r.status === 'sent' ? "#00C896" : r.status === 'failed' ? "#E84545" : r.status === 'scheduled' ? "#6366f1" : "#94A3B8",
                                    }} />
                                    <span style={{ fontSize: 11, color: "#475569" }}>
                                      {r.subject ?? (r.days_offset < 0 ? `D${r.days_offset}` : r.days_offset === 0 ? 'D0' : `D+${r.days_offset}`)}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {r.sent_at && <span style={{ fontSize: 10, color: "#64748B" }}>{r.sent_at}</span>}
                                    {!r.sent_at && <span style={{ fontSize: 10, color: "#94A3B8" }}>{r.scheduled_at}</span>}
                                    <span style={{
                                      fontSize: 9, fontWeight: 600, borderRadius: 100, padding: "1px 6px",
                                      background: r.status === 'sent' ? "rgba(0,200,150,0.1)" : r.status === 'failed' ? "rgba(232,69,69,0.1)" : r.status === 'scheduled' ? "rgba(99,102,241,0.1)" : "#F1F5F9",
                                      color: r.status === 'sent' ? "#00C896" : r.status === 'failed' ? "#E84545" : r.status === 'scheduled' ? "#818CF8" : "#64748B",
                                    }}>
                                      {r.status === 'sent' ? 'Enviado' : r.status === 'failed' ? 'Falhou' : r.status === 'scheduled' ? 'Agendado' : 'Cancelado'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUBMIT ── */}
                <ButtonLoading isLoading={isPending} type="submit" className="alter-submit">
                  Salvar alterações
                </ButtonLoading>

              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <BillingRulesDialog
        clientId={id}
        open={billingDialogOpen}
        onClose={() => setBillingDialogOpen(false)}
        onSuccess={() => refetchBilling()}
      />
    </>
  );
}
