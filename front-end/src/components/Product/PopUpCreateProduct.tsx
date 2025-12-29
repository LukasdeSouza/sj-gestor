import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { ProductSchemas } from "@/schemas/ProductSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Client } from "@/api/models/clients";
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

export function PopupCreateProduct({ onSuccess }: Props) {

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [open, setOpen] = useState(false);

  const schema = ProductSchemas.create;

  const formProduct = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: undefined,
      value: 0,
      user_id: parsedUser.id,
    }
  });

  const { reset } = formProduct;

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        description: undefined,
        value: 0,
        user_id: parsedUser?.id,
      });
    }
  }, [open, reset, parsedUser?.id]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, Client>({
        route: "/products",
        method: "POST",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Produto criado com sucesso!");
      setOpen(false);
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
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Produto</DialogTitle>
        </DialogHeader>
        <Form {...formProduct}>
          <form className="space-y-4" onSubmit={formProduct.handleSubmit((data) => mutate(data))}>


            <FormField
              control={formProduct.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome <span className="text-red-600">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="name" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Observações importantes..." {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={formProduct.control}
              name="value" // Mude "value" para o nome real do campo no seu schema, se for diferente
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) <span className="text-red-600">*</span></FormLabel>
                  <FormControl>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? undefined : value);
                      }}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-row justify-between">
              <ButtonLoading isLoading={isPending} type="submit" >
                Criar Produto
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}