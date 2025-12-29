import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PixKeySchemas } from "@/schemas/PixKeySchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import SpinnerLoading from "../SpinnerLoading";
import { PixKey } from "@/api/models/pixKeys";
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

export function PopupAlterPixKey({ id, onSuccess }: Props) {

  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<PixKey>({
    queryKey: ["getPixkey", id],
    queryFn: async () => {
      return await fetchUseQuery<undefined, PixKey>({
        route: `/pix_keys/${id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: open && !!id,
  });

  const schema = PixKeySchemas.alter;

  const formPixKey = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      key_type: "",
      key_value: "",
      label: undefined,
      user_id: data?.user_id,
    }
  });

  const { reset } = formPixKey;

  useEffect(() => {
    if (data) {
      reset({
        key_type: data.key_type ?? "",
        key_value: data.key_value ?? "",
        label: data.label ?? undefined,
        user_id: data?.user_id,
      });
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, PixKey>({
        route: `/pix_keys/${id}`,
        method: "PATCH",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Chave PIX alterada com sucesso!");
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

  const keyTypes = [
    { value: "cpf", label: "CPF" },
    { value: "cnpj", label: "CNPJ" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Telefone" },
    { value: "random", label: "Chave Aleatória" },
  ];

  // console.log("OLHA O ERRO", formPixKey.formState.errors)
  // console.log("OLHA O BODY", formPixKey.getValues())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Chave PIX</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <SpinnerLoading />
        ) : (
          <Form {...formPixKey}>
            <form className="space-y-4" onSubmit={formPixKey.handleSubmit((data) => mutate(data))}>
              <FormField
                control={formPixKey.control}
                name="key_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Chave <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value: string) => field.onChange(value === "" ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {keyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formPixKey.control}
                name="key_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite a chave PIX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formPixKey.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificação</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Identificação" {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-row justify-between">
                <ButtonLoading isLoading={isPending} type="submit" >
                  Editar Chave PIX
                </ButtonLoading>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}