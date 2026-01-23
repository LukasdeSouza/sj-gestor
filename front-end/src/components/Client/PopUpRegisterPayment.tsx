import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CreateClientPaymentData } from "@/api/models/clientPayment";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { CalendarIcon, CreditCard } from "lucide-react";
import { ClientSchemas } from "@/schemas/ClientSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ButtonLoading from "../ButtonLoading";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { Textarea } from "../ui/textarea";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface Props {
  id: string;
  onSuccess: () => void;
}

export function PopUpRegisterPayment({ id, onSuccess }: Props) {

  const schema = ClientSchemas.alterPayment;

  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      paid_at: new Date(),
      amount: undefined,
      note: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      await fetchUseQuery<typeof data, CreateClientPaymentData>({
        route: `/clients/${id}/payments`,
        method: "POST",
        data
      });
    },
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      setOpen(false)
      onSuccess();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="w-4 h-4 mr-2" /> Registrar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutate(data))}>
            <FormField
              control={form.control}
              name="paid_at"
              render={({ field }) => (
                <FormItem >
                  <FormLabel>Data do pagamento <span className="text-red-600">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione uma data"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date instanceof Date ? date : null);
                        }}
                        defaultMonth={field.value || new Date()}
                        captionLayout="dropdown" // Isso ativa a seleção de mês/ano
                      />
                      {/* Botão para limpar a data */}
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => field.onChange(null)}
                      >
                        Limpar data
                      </Button>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0,00" value={field.value as any ?? ''} onChange={(e) => field.onChange(e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="ex.: PIX confirmado, ajuste manual, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <ButtonLoading type="submit" isLoading={isPending}>
                Salvar
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

