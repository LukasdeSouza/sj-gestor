import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { MessageTemplateSchemas } from "@/schemas/TemplateSchema";
import { MessageTemplate } from "@/api/models/messageTemplate";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Client } from "@/api/models/clients";
import ButtonLoading from "../ButtonLoading";
import { Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { z } from "zod";
import SpinnerLoading from "../SpinnerLoading";

interface Props {
  id: string;
  onSuccess: () => void;
}

export function PopUpAlterTemplate({ id, onSuccess }: Props) {

  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<MessageTemplate>({
    queryKey: ["getTemplate", id],
    queryFn: async () => {
      return await fetchUseQuery<undefined, MessageTemplate>({
        route: `/message_templates/${id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: open && !!id,
  });

  const schema = MessageTemplateSchemas.create;

  const formTemplate = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      content: "",
      user_id: data?.id,
    }
  });

  const { reset } = formTemplate;

  useEffect(() => {
    if (data) {
      reset({
        name: data.name ?? "",
        content: data.content ?? "",
        user_id: data?.user_id,
      });
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, Client>({
        route: `/message_templates/${id}`,
        method: "PATCH",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Template alterado com sucesso!");
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

  // console.log("OLHA O ERRO", formTemplate.formState.errors)
  // console.log("OLHA O BODY", formTemplate.getValues())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alterar Template</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <SpinnerLoading />
        ) : (
          <Form {...formTemplate}>
            <form className="space-y-4" onSubmit={formTemplate.handleSubmit((data) => mutate(data))}>

              <FormField
                control={formTemplate.control}
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
                control={formTemplate.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Mensagem..." {...field} />
                    </FormControl>
                    <FormMessage>Dica: Use variáveis como {"{nome}"}, {"{valor}"}, {"{vencimento}"} para personalizar</FormMessage>
                  </FormItem>
                )}
              />

              <div className="flex flex-row justify-between">
                <ButtonLoading isLoading={isPending} type="submit" >
                  Alterar Template
                </ButtonLoading>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}