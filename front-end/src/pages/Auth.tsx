import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AuthSchemas } from "@/schemas/AuthSchemas";
import { LoginResponse } from "@/api/models/auth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
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
      toast.success("Bem-vindo ao Cobr! 🎉");
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
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      } else {
        toast.error("Erro ao fazer login. Verifique suas credenciais.");
      }
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
      toast.success("Conta criada com sucesso! 🎉");
      setTab("login");
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    },
  });

  const handleSignup = (data: z.infer<typeof signupSchema>) => {
    signupMutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-gradient p-4">
      <Card className="w-full max-w-md shadow-strong animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-cobr-gradient flex items-center justify-center hover-lift">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cobr</h1>
          <CardDescription>Gestão inteligente de cobranças com WhatsApp</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Cadastro
              </TabsTrigger>
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
                        <FormLabel htmlFor="login-email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            id="login-email" 
                            placeholder="seu@email.com"
                            className="focus-cobr"
                            {...field} 
                          />
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
                        <FormLabel htmlFor="login-password" className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Senha
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPasswordLogin ? "text" : "password"}
                              id="login-password"
                              placeholder="••••••••"
                              className="focus-cobr"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cobr-600 transition-colors"
                            onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                          >
                            {showPasswordLogin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <ButtonLoading type="submit" className="w-full bg-cobr-600 hover:bg-cobr-700" isLoading={loginLoading}>
                    Entrar no Cobr
                  </ButtonLoading>
                  <div className="text-center">
                    <a 
                      href="/forgot-password" 
                      className="text-sm text-muted-foreground hover:text-cobr-600 transition-colors"
                    >
                      Esqueceu sua senha?
                    </a>
                  </div>
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
                        <FormLabel htmlFor="signup-full-name" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Nome Completo
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            id="signup-full-name" 
                            placeholder="Seu nome" 
                            className="focus-cobr"
                            {...field} 
                          />
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
                        <FormLabel htmlFor="signup-email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            id="signup-email" 
                            placeholder="seu@email.com" 
                            className="focus-cobr"
                            {...field} 
                          />
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
                        <FormLabel htmlFor="signup-password" className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Senha
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPasswordSignup ? "text" : "password"}
                              id="signup-password"
                              placeholder="••••••••"
                              className="focus-cobr"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cobr-600 transition-colors"
                            onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                          >
                            {showPasswordSignup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <ButtonLoading type="submit" className="w-full bg-cobr-600 hover:bg-cobr-700" isLoading={signupLoading}>
                    Criar conta no Cobr
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
