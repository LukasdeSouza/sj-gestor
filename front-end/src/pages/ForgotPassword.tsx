import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import SJGestor from "../assets/sj-gestor-removebg.png";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      return await fetchUseQuery<ForgotPasswordFormData, { message: string }>({
        route: "/auth/forgot-password",
        method: "POST",
        data,
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Email de recuperação enviado com sucesso!");
      form.reset();
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      } else {
        toast.error(error.message || "Erro ao enviar email de recuperação");
      }
    },
  });

  const handleSubmit = (data: ForgotPasswordFormData) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center -mb-12">
            <img src={SJGestor} alt="" height={220} width={220} />
          </div>
          <h2 className="text-2xl font-bold">Recuperar Senha</h2>
          <CardDescription>
            Digite seu email para receber um link de recuperação de senha
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="forgot-email">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        id="forgot-email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ButtonLoading
                type="submit"
                className="w-full"
                isLoading={isPending}
              >
                Enviar Email de Recuperação
              </ButtonLoading>
            </form>
          </Form>

          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Login
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
