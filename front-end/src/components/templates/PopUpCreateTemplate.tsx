import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { MessageTemplateSchemas } from "@/schemas/TemplateSchema";
import { MessageTemplate } from "@/api/models/messageTemplate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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

export function PopUpCreateTemplate({ onSuccess }: Props) {

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [open, setOpen] = useState(false);

  const schema = MessageTemplateSchemas.create;

  const formTemplate = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      content: "",
      user_id: parsedUser?.id,
    }
  });

  const { reset } = formTemplate;

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        content: "",
        user_id: parsedUser?.id,
      });
    }
  }, [open, reset, parsedUser?.id]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, MessageTemplate>({
        route: "/message_templates",
        method: "POST",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Template criada com sucesso!");
      setOpen(false);
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
          <Plus className="w-4 h-4 mr-2" />
          Nova Template
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Template</DialogTitle>
        </DialogHeader>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormMessage className="text-white">Dica: Use variáveis como {"{nome}"}, {"{valor}"}, {"{vencimento}"} para personalizar</FormMessage>

            <div className="flex flex-row justify-between">
              <ButtonLoading isLoading={isPending} type="submit" >
                Criar Template
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}