import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { PixKeySchemas } from "@/schemas/PixKeySchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PixKey } from "@/api/models/pixKeys";
import ButtonLoading from "../ButtonLoading";
import { AuthUser } from "@/api/models/auth";
import { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { Plus } from "lucide-react";
import Cookies from "js-cookie";
import { z } from "zod";

interface Props {
  onSuccess: () => void;
}

export function PopupCreatePixKey({ onSuccess }: Props) {

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [open, setOpen] = useState(false);

  const schema = PixKeySchemas.create;

  const formPixKey = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      key_type: "",
      key_value: "",
      label: undefined,
      user_id: parsedUser?.id,
    }
  });

  const { reset } = formPixKey;

  useEffect(() => {
    if (!open) {
      reset({
        key_type: "",
        key_value: "",
        label: undefined,
        user_id: parsedUser?.id,
      });
    }
  }, [open, reset, parsedUser?.id]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, PixKey>({
        route: "/pix_keys",
        method: "POST",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Chave PIX criado com sucesso!");
      setOpen(false)
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
          <Plus className="w-4 h-4 mr-2" />
          Nova Chave PIX
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Chave PIX</DialogTitle>
        </DialogHeader>
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
                Criar Chave PIX
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}