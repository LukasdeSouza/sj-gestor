import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import SJGestor from "../assets/sj-gestor-removebg.png";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AuthSchemas } from "@/schemas/AuthSchemas";
import { LoginResponse } from "@/api/models/auth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useState } from "react";
import Cookies from "js-cookie";
import z from "zod";

export default function LoginAuth() {
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  // ===== LOGIN =====
  const loginSchema = AuthSchemas.login;
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: loginMutate, isPending: loginLoading } = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      return await fetchUseQuery<typeof data, LoginResponse>({
        route: "/auth/login",
        method: "POST",
        data,
      });
    },
    onSuccess: (res) => {
      toast.success("Usuário logado com sucesso!");

      Cookies.set(TOKEN_COOKIE_KEY, res.token, { expires: 15 });

      Cookies.set(USER_COOKIE_KEY, JSON.stringify({
        email: res.user.email,
        name: res.user.name,
        id: res.user.id,
        group: res.user.group
      }), { expires: 15 });
      navigate("/dashboard")
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  // ===== SIGNUP =====
  const signupSchema = AuthSchemas.signup;
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const { mutate: signupMutate, isPending: signupLoading } = useMutation({
    mutationFn: async (data: z.infer<typeof signupSchema>) => {
      return await fetchUseQuery<typeof data, LoginResponse>({
        route: "/register",
        method: "POST",
        data,
      });
    },
    onSuccess: (res) => {
      toast.success("Conta criada com sucesso!");
      setTab("login");
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
    },
  });

  const handleSignup = (data: z.infer<typeof signupSchema>) => {
    signupMutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center -mb-12">
            <img src={SJGestor} alt="" height={220} width={220} />
          </div>
          <CardDescription>Sistema de gestão de cobranças com WhatsApp</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            {/* ===== LOGIN TAB ===== */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit((data) => loginMutate(data))} className="space-y-4">
                  <FormField
                    name="email"
                    control={loginForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-email">Email</FormLabel>
                        <FormControl>
                          <Input type="email" id="login-email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="password"
                    control={loginForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-password">Senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPasswordLogin ? "text" : "password"}
                              id="login-password"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                          >
                            {showPasswordLogin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <ButtonLoading type="submit" className="w-full" isLoading={loginLoading}>
                    Entrar
                  </ButtonLoading>
                </form>
              </Form>
            </TabsContent>

            {/* ===== SIGNUP TAB ===== */}
            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <FormField
                    name="name"
                    control={signupForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-full-name">Nome Completo</FormLabel>
                        <FormControl>
                          <Input type="text" id="signup-full-name" placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="email"
                    control={signupForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-email">Email</FormLabel>
                        <FormControl>
                          <Input type="email" id="signup-email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="password"
                    control={signupForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="signup-password">Senha</FormLabel>
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
                  <ButtonLoading type="submit" className="w-full" isLoading={signupLoading}>
                    Criar conta
                  </ButtonLoading>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
