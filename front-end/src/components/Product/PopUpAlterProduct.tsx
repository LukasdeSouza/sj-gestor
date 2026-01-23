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

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
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
                    <FormMessage />
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