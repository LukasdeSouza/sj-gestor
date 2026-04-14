import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CreateClientPaymentData } from "@/api/models/clientPayment";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { CalendarIcon, CreditCard, CheckCircle2 } from "lucide-react";
import { ClientSchemas } from "@/schemas/ClientSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ButtonLoading from "../ButtonLoading";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";

const PAYMENT_METHODS = [
  { value: "pix",      label: "PIX",           color: "#00C896" },
  { value: "card",     label: "Cartão",         color: "#6366f1" },
  { value: "cash",     label: "Dinheiro",       color: "#F5A623" },
  { value: "transfer", label: "Transferência",  color: "#14b8a6" },
  { value: "other",    label: "Outro",          color: "#8b5cf6" },
] as const;

interface Props {
  id: string;
  onSuccess: () => void;
}

const LABEL: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: "#7A9087", marginBottom: 4, display: "block",
};

export function PopUpRegisterPayment({ id, onSuccess }: Props) {
  const schema = ClientSchemas.alterPayment;
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { paid_at: new Date(), amount: undefined, note: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      await fetchUseQuery<typeof data & { payment_method: string }, CreateClientPaymentData>({
        route: `/clients/${id}/payments`,
        method: "POST",
        data: { ...data, payment_method: paymentMethod },
      });
    },
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      setOpen(false);
      form.reset({ paid_at: new Date(), amount: undefined, note: "" });
      setPaymentMethod("pix");
      onSuccess();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        .regpay-input {
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important; color: #F0F5F2 !important;
          font-size: 13px !important; font-family: 'DM Sans', sans-serif !important;
          height: 40px !important; padding: 0 12px !important;
          width: 100%; outline: none; transition: border-color 0.2s !important;
          box-sizing: border-box;
        }
        .regpay-input:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
        }
        .regpay-input::placeholder { color: #2A4A40 !important; }
        .regpay-textarea {
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important; color: #F0F5F2 !important;
          font-size: 13px !important; font-family: 'DM Sans', sans-serif !important;
          resize: vertical !important; padding: 10px 12px !important;
          width: 100%; outline: none; transition: border-color 0.2s !important;
          box-sizing: border-box; line-height: 1.5;
        }
        .regpay-textarea:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
        }
        .regpay-textarea::placeholder { color: #2A4A40 !important; }
        .regpay-cal-btn {
          width: 100%; height: 40px;
          background: #111614 !important; border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important; color: #F0F5F2 !important;
          font-size: 13px !important; font-family: 'DM Sans', sans-serif !important;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 12px; cursor: pointer; transition: border-color 0.2s;
        }
        .regpay-cal-btn:hover { border-color: rgba(0,200,150,0.3) !important; }
        .regpay-cal-btn.empty { color: #2A4A40 !important; }
        .regpay-submit {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: #00C896 !important; color: #051A12 !important;
          border: none !important; border-radius: 8px !important;
          padding: 0.7rem 1.5rem !important;
          font-family: 'Syne', sans-serif !important;
          font-size: 0.88rem !important; font-weight: 700 !important;
          cursor: pointer !important; transition: background 0.2s !important;
          width: 100% !important;
        }
        .regpay-submit:hover:not(:disabled) { background: #00A87E !important; }
        .regpay-submit:disabled { opacity: 0.65 !important; cursor: not-allowed !important; }
        .regpay-trigger {
          background: none !important; border: 1px solid rgba(255,255,255,0.07) !important;
          color: #5A7A70 !important; border-radius: 8px !important;
          padding: 6px 12px !important; font-size: 12px !important; font-weight: 600 !important;
          cursor: pointer !important; display: flex !important; align-items: center !important; gap: 6px !important;
          font-family: 'DM Sans', sans-serif !important; transition: all 0.15s !important;
          white-space: nowrap !important;
        }
        .regpay-trigger:hover { border-color: rgba(0,200,150,0.3) !important; color: #00C896 !important; }
      `}</style>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="regpay-trigger">
            <CreditCard size={13} /> Registrar pagamento
          </button>
        </DialogTrigger>

        <DialogContent style={{
          maxWidth: 420, padding: 0, overflow: "hidden",
          borderRadius: 18, background: "#0D1210",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <DialogHeader style={{ display: "none" }}>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>

          {/* Header */}
          <div style={{
            padding: "22px 24px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "rgba(0,200,150,0.12)", border: "1px solid rgba(0,200,150,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle2 size={17} color="#00C896" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F5F2", fontFamily: "'Syne', sans-serif" }}>
                Registrar pagamento
              </div>
              <div style={{ fontSize: 12, color: "#5A7A70", marginTop: 2 }}>
                Confirme os dados do pagamento recebido
              </div>
            </div>
          </div>

          {/* Body */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutate(data))}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Data */}
                <FormField
                  control={form.control}
                  name="paid_at"
                  render={({ field }) => (
                    <FormItem>
                      <label style={LABEL}>
                        Data do pagamento <span style={{ color: "#E84545" }}>*</span>
                      </label>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={`regpay-cal-btn${!field.value ? " empty" : ""}`}
                            >
                              <span>{field.value ? format(field.value, "dd/MM/yyyy") : "Selecione uma data"}</span>
                              <CalendarIcon size={14} style={{ opacity: 0.4 }} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => field.onChange(date instanceof Date ? date : null)}
                              defaultMonth={field.value || new Date()}
                              captionLayout="dropdown"
                            />
                            <Button variant="ghost" className="w-full" onClick={() => field.onChange(null)}>
                              Limpar data
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Valor */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <label style={LABEL}>Valor recebido (opcional)</label>
                      <FormControl>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          className="regpay-input"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            field.onChange(isNaN(v) ? undefined : v);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Forma de pagamento */}
                <div>
                  <label style={LABEL}>Forma de pagamento</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    {PAYMENT_METHODS.map(({ value, label, color }) => {
                      const active = paymentMethod === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaymentMethod(value)}
                          style={{
                            padding: "5px 13px", borderRadius: 100, fontSize: 11, fontWeight: 600,
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

                {/* Observação */}
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <label style={LABEL}>Observação (opcional)</label>
                      <FormControl>
                        <textarea
                          rows={3}
                          placeholder="ex.: PIX confirmado, ajuste manual, etc."
                          className="regpay-textarea"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Footer */}
              <div style={{
                padding: "0 24px 20px",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: 16,
              }}>
                <ButtonLoading type="submit" isLoading={isPending} className="regpay-submit">
                  Confirmar pagamento
                </ButtonLoading>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
