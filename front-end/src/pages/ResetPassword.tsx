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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const resetPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      return await fetchUseQuery<
        { email: string; password: string },
        { message: string }
      >({
        route: "/auth/reset-password",
        method: "POST",
        data: {
          email: data.email,
          password: data.password,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Senha alterada com sucesso!");
      form.reset();
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      } else {
        toast.error(error.message || "Erro ao alterar senha");
      }
    },
  });

  const handleSubmit = (data: ResetPasswordFormData) => {
    mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center -mb-12">
            <img src={SJGestor} alt="" height={220} width={220} />
          </div>
          <h2 className="text-2xl font-bold">Alterar Senha</h2>
          <CardDescription>
            Digite seu email e a nova senha
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
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        id="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password">Nova Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="confirmPassword"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword">Confirmar Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ButtonLoading
                type="submit"
                className="w-full"
                isLoading={isPending}
              >
                Alterar Senha
              </ButtonLoading>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
