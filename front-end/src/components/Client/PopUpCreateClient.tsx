import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { ApiErrorQuery, fetchUseQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { MessageTemplate } from "@/api/models/messageTemplate";
import { PopoverContent, PopoverTrigger } from "../ui/popover";
import { CreateClientData } from "@/api/models/clients";
import { ClientSchemas } from "@/schemas/ClientSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import ComboboxDebounce from "../ComboboxDebounce";
import { CalendarIcon, Plus } from "lucide-react";
import { Popover } from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Product } from "@/api/models/products";
import { mascaraTelefone } from "@/utils/mask";
import { PixKey } from "@/api/models/pixKeys";
import ButtonLoading from "../ButtonLoading";
import { AuthUser } from "@/api/models/auth";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { Calendar } from "../ui/calendar";
import { toast } from "react-toastify";
import { Input } from "../ui/input";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { z } from "zod";

interface Props {
  onSuccess: () => void;
}

export function PopupCreateClient({ onSuccess }: Props) {

  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;

  const [open, setOpen] = useState(false);

  const schema = ClientSchemas.create;

  const formClient = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: undefined,
      due_at: new Date(),
      additional_info: undefined,
      user_id: parsedUser?.id,
      product_id: "",
      template_id: "",
      key_id: "",
      observacoes1: "",
      observacoes2: ""
    }
  });

  const { reset } = formClient;

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        phone: "",
        email: undefined,
        due_at: new Date(),
        additional_info: undefined,
        product_id: "",
        template_id: "",
        key_id: "",
        user_id: parsedUser?.id,
      });
    }
  }, [open, reset, parsedUser?.id]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      return await fetchUseQuery<typeof data, CreateClientData>({
        route: "/clients",
        method: "POST",
        data,
      });
    },

    onSuccess: async () => {
      toast.success("Cliente cadastrado com sucesso!");
      setOpen(false);
      onSuccess();
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      }
    }
  });

  const [productValue, setProductValue] = useState<Product>();
  const [templateValue, setTemplateValue] = useState<MessageTemplate>();
  const [keyValue, setKeyValue] = useState<PixKey>();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Cliente</DialogTitle>
        </DialogHeader>
        <Form {...formClient}>
          <form className="space-y-4" onSubmit={formClient.handleSubmit((data) => mutate(data))}>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formClient.control}
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
                control={formClient.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone <span className="text-red-600">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(69) 9XXXX-XXXX"
                        {...field}
                        value={mascaraTelefone(field.value)}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                        onBlur={() => {
                          const v = field.value.replace(/\D/g, '');
                          if (v.length === 10 && v[2] !== '9') {
                            const ajustado = v.slice(0, 2) + '9' + v.slice(2);
                            field.onChange(ajustado);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">Formato: DDD + 9 dígitos. Ex.: 69 9XXXX-XXXX</p>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={formClient.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@exemplo.com"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        const trimmedValue = e.target.value.trim();
                        field.onChange(trimmedValue === "" ? undefined : trimmedValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={formClient.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="cobrancas">
                      Produto <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboboxDebounce
                        route={"/products?name"}
                        queryKey="productsQueryKey"
                        dataField="products"
                        placeholderInputSearch={"Busque por nome"}
                        placeholderUnselected={"Selecione o produto"}
                        selecionado={field.value as unknown as Product[] ?? productValue as Product}
                        setSelecionado={(value) => {
                          const body = value as unknown as Product;
                          field.onChange(body.id);
                          setProductValue(body)
                        }}
                        selectedField={(selecionado: Product) => selecionado?.name}
                        renderOption={(dados) => (
                          <span key={(dados as unknown as Product).id}>
                            {typeof dados === 'string' ? dados : (dados as Product)?.name}
                          </span>
                        )}
                        visualizacao={productValue?.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formClient.control}
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="template">
                      Template <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboboxDebounce
                        route={"/message_templates?name"}
                        queryKey="templatesQueryKey"
                        dataField="templates"
                        placeholderInputSearch={"Busque por nome"}
                        placeholderUnselected={"Selecione a template"}
                        selecionado={field.value as unknown as MessageTemplate[] ?? templateValue as MessageTemplate}
                        setSelecionado={(value) => {
                          const body = value as unknown as MessageTemplate;
                          field.onChange(body.id);
                          setTemplateValue(body)
                        }}
                        selectedField={(selecionado: MessageTemplate) => selecionado?.name}
                        renderOption={(dados) => (
                          <span key={(dados as unknown as MessageTemplate).id}>
                            {typeof dados === 'string' ? dados : (dados as MessageTemplate)?.name}
                          </span>
                        )}
                        visualizacao={templateValue?.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={formClient.control}
                name="key_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="key">
                      Chave PIX <span className="text-red-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboboxDebounce
                        route={"/pix_keys?name"}
                        queryKey="keysQueryKey"
                        dataField="keys"
                        placeholderInputSearch={"Busque por nome"}
                        placeholderUnselected={"Selecione o PIX"}
                        selecionado={field.value as unknown as PixKey[] ?? keyValue as PixKey}
                        setSelecionado={(value) => {
                          const body = value as unknown as PixKey;
                          field.onChange(body.id);
                          setKeyValue(body)
                        }}
                        selectedField={(selecionado: PixKey) => selecionado?.key_value}
                        renderOption={(dados) => (
                          <span key={(dados as unknown as PixKey).id}>
                            {typeof dados === 'string' ? dados : (dados as PixKey)?.key_value}
                          </span>
                        )}
                        visualizacao={keyValue?.key_value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formClient.control}
                name="due_at"
                render={({ field }) => (
                  <FormItem >
                    <FormLabel>Data cobrança <span className="text-red-600">*</span></FormLabel>
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
            </div>

            <FormField
              control={formClient.control}
              name="observacoes1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observacoes Campo 1 (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Observações relacionadas a este cliente..."
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formClient.control}
              name="observacoes2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observacoes Campo 2 (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Observações relacionadas a este cliente..."
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-row justify-between">
              <ButtonLoading isLoading={isPending} type="submit" >
                Criar Cliente
              </ButtonLoading>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
