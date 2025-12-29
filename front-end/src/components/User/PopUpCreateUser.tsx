import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CreateUserData } from "@/api/models/users";
import { UserSchemas } from "@/schemas/UserSchema";
import ComboboxDebounce from "../ComboboxDebounce";
import { Eye, EyeOff, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ButtonLoading from "../ButtonLoading";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { useState } from "react";
import { z } from "zod";

interface Props {
  onSuccess: () => void;
}

export function PopUpCreateUser({ onSuccess }: Props) {

  const [showPasswordSignup, setShowPasswordSignup] = useState(false);

  const [open, setOpen] = useState(false);

  const schema = UserSchemas.create;

  const formUser = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      groupId: ""
    }
  });

  const { reset } = formUser;

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, CreateUserData>({
        route: "/users",
        method: "POST",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Usuário criado com sucesso!");
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

  const [groupValue, setGroupValue] = useState<any | null>(null);

  // console.log("OLHA O ERRO", formUser.formState.errors)
  // console.log("OLHA O BODY", formUser.getValues())

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
          <DialogTitle>Cadastrar Usuário</DialogTitle>
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
              name="password"
              control={formUser.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="signup-password">Senha <span className="text-red-600">*</span></FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPasswordSignup ? "text" : "password"}
                        id="signup-password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                    >
                      {showPasswordSignup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row justify-between">
              <ButtonLoading isLoading={isPending} type="submit" >
                Criar Usuário
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}