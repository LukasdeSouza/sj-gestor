import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchemas } from "@/schemas/UserSchema";
import ComboboxDebounce from "../ComboboxDebounce";
import { Button } from "@/components/ui/button";
import ButtonLoading from "../ButtonLoading";
import { useEffect, useState } from "react";
import { User } from "@/api/models/users";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Pencil } from "lucide-react";
import { Input } from "../ui/input";
import { z } from "zod";

interface Props {
  id: string;
  onSuccess: () => void;
}

export function PopupAlterUser({ id, onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<User>({
    queryKey: ["getUser", id],
    queryFn: async () => {
      return await fetchUseQuery<undefined, User>({
        route: `/users/${id}`,
        method: "GET",
      });
    },
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: open && !!id,
  });

  const schema = UserSchemas.alter;

  const formUser = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      groupId: "",
      planId: "FREE"
    }
  });

  const { reset } = formUser;

  useEffect(() => {
    if (data) {
      reset({
        name: data.name ?? "",
        email: data.email ?? "",
        groupId: data.group?.id ?? "",
        planId: (data.subscription?.plan_id as any) ?? "FREE",
      });
      setGroupValue(data.group ? { id: data.group.id, name: data.group.name } : null);
      setPlanValue(
        data.subscription?.plan_id
          ? { id: data.subscription.plan_id, name: data.subscription.plan_id }
          : null
      );
    }
  }, [data, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, User>({
        route: `/users/${id}`,
        method: "PATCH",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Usuário alterado com sucesso!");
      setOpen(false)
      reset();
      onSuccess();
      refetch();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  const [groupValue, setGroupValue] = useState<any | null>(null);
  const [planValue, setPlanValue] = useState<any | null>(null);

  // Form e mutation para ativação manual (alinhado ao padrão do projeto)
  const activationSchema = z.object({
    activatedAt: z.string().optional(),
    paymentId: z.string().optional(),
  });

  const formActivation = useForm<z.infer<typeof activationSchema>>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      activatedAt: "",
      paymentId: "",
    },
  });

  const {
    mutate: activateSubscription,
    isPending: isActivating,
  } = useMutation({
    mutationFn: async (payload: z.infer<typeof activationSchema>) => {
      return await fetchUseQuery<typeof payload, any>({
        route: `/admin/users/${id}/subscription/activate`,
        method: "POST",
        data: payload,
      });
    },
    onSuccess: async () => {
      toast.success("Assinatura marcada como ativa");
      formActivation.reset();
      onSuccess();
      refetch();
    },
    onError: () => {
      toast.error("Falha ao ativar assinatura");
    },
  });

  // console.log("OLHA O ERRO", formUser.formState.errors)
  // console.log("OLHA O BODY", formUser.getValues())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <Form {...formUser}>
          <form className="space-y-4" onSubmit={formUser.handleSubmit((data) => mutate(data))}>

            <FormField
              control={formUser.control}
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
              control={formUser.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail <span className="text-red-600">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="E-mail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formUser.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Grupo <span className="text-red-600">*</span>
                  </FormLabel>

                  <FormControl>
                    <ComboboxDebounce
                      route="/groups?name"
                      queryKey="groupQueryKey"
                      dataField="groups"
                      placeholderInputSearch="Busque por nome"
                      placeholderUnselected="Selecione o grupo"
                      selecionado={groupValue as any}
                      setSelecionado={(value) => {
                        setGroupValue(value as any);

                        // mantém o react-hook-form sincronizado
                        field.onChange((value as any)?.id ?? null);
                      }}
                      selectedField={(selecionado: any) => selecionado?.name}
                      renderOption={(dados) => {
                        const key = dados as any;
                        return <span key={key.id}>{key.name}</span>;
                      }}
                      visualizacao={groupValue?.name}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={formUser.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Plano <span className="text-red-600">*</span>
                  </FormLabel>

                  <FormControl>
                    <ComboboxDebounce
                      route="/plans?name"
                      queryKey="planQueryKey"
                      dataField="plans"
                      placeholderInputSearch="Busque por nome"
                      placeholderUnselected="Selecione o plano"
                      selecionado={planValue as any}
                      setSelecionado={(value) => {
                        setPlanValue(value as any);

                        // mantém o react-hook-form sincronizado
                        field.onChange((value as any)?.id ?? null);
                      }}
                      selectedField={(selecionado: any) => selecionado?.name}
                      renderOption={(dados) => {
                        const key = dados as any;
                        return <span key={key.id}>{key.name}</span>;
                      }}
                      visualizacao={planValue?.name}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {data?.subscription?.status && data.subscription.status !== "ACTIVE" && (
              <Form {...formActivation}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formActivation.control}
                    name="activatedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do pagamento</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formActivation.control}
                    name="paymentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do pagamento (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="pi_... ou código do gateway" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <ButtonLoading
                      type="button"
                      isLoading={isActivating}
                      variant="secondary"
                      onClick={() => formActivation.handleSubmit((payload) => activateSubscription(payload))()}
                    >
                      Ativar assinatura
                    </ButtonLoading>
                  </div>
                </div>
              </Form>
            )}

            <div className="flex flex-row justify-between">
              <ButtonLoading isLoading={isPending} type="submit" >
                Editar Usuário
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
