import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ProductSchemas } from "@/schemas/ProductSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Product } from "@/api/models/products";
import SpinnerLoading from "../SpinnerLoading";
import { Client } from "@/api/models/clients";
import ButtonLoading from "../ButtonLoading";
import { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Pencil } from "lucide-react";
import { Input } from "../ui/input";
import { z } from "zod";

interface Props {
  id: string;
  onSuccess: () => void;
}

export function PopupAlterProduct({ id, onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<Product>({
    queryKey: ["getProduct", id],
    queryFn: async () => {
      return await fetchUseQuery<undefined, Product>({
        route: `/products/${id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: open && !!id,
  });

  const schema = ProductSchemas.alter;

  const formProduct = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: undefined,
      value: 0,
      user_id: data?.id,
    }
  });

  const { reset } = formProduct;

  useEffect(() => {
    if (data) {
      reset({
        name: data.name ?? "",
        value: data.value ?? 0,
        description: data.description ?? undefined,
        late_fee_percent: (data as any).late_fee_percent ?? undefined,
        late_interest_percent: (data as any).late_interest_percent ?? undefined,
        user_id: data?.user_id,
      });
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, Client>({
        route: `/products/${id}`,
        method: "PATCH",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Produto criado com sucesso!");
      setOpen(false)
      reset();
      onSuccess();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  // console.log("OLHA O ERRO", formProduct.formState.errors)
  // console.log("OLHA O BODY", formProduct.getValues())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil className="w-4 h-4 mr-2" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-[#E2E8F0] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-['Montserrat'] font-extrabold text-[#0F172A]">Editar Produto</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <SpinnerLoading />
        ) : (
          <Form {...formProduct}>
            <form className="space-y-4" onSubmit={formProduct.handleSubmit((data) => mutate(data))}>
              <FormField
                control={formProduct.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#64748B] font-medium text-[0.8rem]">Nome <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <Input className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#00C896]/40 focus:ring-[#00C896]/10" placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formProduct.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#64748B] font-medium text-[0.8rem]">Descrição</FormLabel>
                    <FormControl>
                      <Textarea className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#00C896]/40 focus:ring-[#00C896]/10" rows={3} placeholder="Observações importantes..." {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formProduct.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#64748B] font-medium text-[0.8rem]">Valor (R$) <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#00C896]/40 focus:ring-[#00C896]/10"
                        type="number" step="0.01" min="0" placeholder="0.00"
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? undefined : v); }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Taxa de atraso ── */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: "14px 16px", background: "#F8FAFC" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Taxa de atraso (opcional)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <FormField
                    control={formProduct.control}
                    name="late_fee_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#64748B] font-medium text-[0.8rem]">Multa <span style={{ color: "#94A3B8", fontWeight: 400 }}>(%)</span></FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#00C896]/40 focus:ring-[#00C896]/10"
                            type="number" step="0.01" min="0" max="100" placeholder="ex: 2"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? undefined : v); }}
                          />
                        </FormControl>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Aplicada uma vez no D+1</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formProduct.control}
                    name="late_interest_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#64748B] font-medium text-[0.8rem]">Juros <span style={{ color: "#94A3B8", fontWeight: 400 }}>(% ao mês)</span></FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-[#E2E8F0] text-[#0F172A] focus:border-[#00C896]/40 focus:ring-[#00C896]/10"
                            type="number" step="0.01" min="0" max="100" placeholder="ex: 1"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => { const v = parseFloat(e.target.value); field.onChange(isNaN(v) ? undefined : v); }}
                          />
                        </FormControl>
                        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Proporcional por dia de atraso</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-row justify-between">
                <ButtonLoading isLoading={isPending} type="submit" >
                  Editar Produto
                </ButtonLoading>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
