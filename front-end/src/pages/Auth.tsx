import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import CobrLogo from "../assets/logo.png";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import Cookies from "js-cookie";
import z from "zod";

const FEATURES = [
  "Régua de cobrança automática",
  "Dashboard de inadimplência em tempo real",
  "Link de pagamento Pix integrado",
  "Sessões WhatsApp seguras e isoladas",
];

export default function LoginAuth() {
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  const [showConfirmPasswordSignup, setShowConfirmPasswordSignup] = useState(false);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  // ===== LOGIN =====
  const loginSchema = AuthSchemas.login;
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
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
        group: res.user.group,
      }), { expires: 15 });
      navigate("/dashboard");
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
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptedTerms: false },
  });

  const { mutate: signupMutate, isPending: signupLoading } = useMutation({
    mutationFn: async (data: z.infer<typeof signupSchema>) => {
      return await fetchUseQuery<typeof data, LoginResponse>({
        route: "/register",
        method: "POST",
        data,
      });
    },
    onSuccess: (res: any) => {
      toast.success("Bem-vindo ao Cobr! Sua conta foi criada. 🎉");
      // Auto-login logic
      Cookies.set(TOKEN_COOKIE_KEY, res.token, { expires: 15 });
      Cookies.set(USER_COOKIE_KEY, JSON.stringify({
        email: res.user.email,
        name: res.user.name,
        id: res.user.id,
        group: res.user.group,
      }), { expires: 15 });

      navigate("/plans?first_time=true");
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
    },
  });

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        .cobr-auth-root {
          min-height: 100vh;
          background: #090C0A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        .cobr-auth-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 880px;
          min-height: 560px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }

        /* ---- LEFT PANEL ---- */
        .cobr-auth-left {
          background: #0D1210;
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .cobr-auth-left::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -100px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,200,150,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        .cobr-logo {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #00C896;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .cobr-logo img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .cobr-left-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem 0;
        }

        .cobr-tagline {
          font-family: 'Syne', sans-serif;
          font-size: 1.65rem;
          font-weight: 800;
          color: #F0F5F2;
          line-height: 1.18;
          letter-spacing: -0.8px;
          margin-bottom: 0.85rem;
        }
        .cobr-tagline-green { color: #00C896; }

        .cobr-desc {
          font-size: 0.875rem;
          color: #6A8A80;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .cobr-feature-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .cobr-feature-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.6rem 0;
          border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 0.82rem;
          color: #7A9087;
        }
        .cobr-feature-item svg {
          color: #00C896;
          flex-shrink: 0;
          width: 14px;
          height: 14px;
        }

        .cobr-footer-copy {
          font-size: 0.72rem;
          color: #2A3A34;
        }

        /* ---- RIGHT PANEL ---- */
        .cobr-auth-right {
          background: #0A0C0B;
          padding: 2.75rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cobr-right-header {
          margin-bottom: 1.75rem;
        }
        .cobr-right-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #F0F5F2;
          margin-bottom: 0.25rem;
          letter-spacing: -0.3px;
        }
        .cobr-right-sub {
          font-size: 0.82rem;
          color: #5A7A70;
        }

        /* TABS */
        .cobr-tabs {
          display: flex;
          gap: 0;
          background: #111614;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 1.75rem;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .cobr-tab {
          flex: 1;
          padding: 0.55rem 0;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          border-radius: 7px;
          cursor: pointer;
          color: #4A6A60;
          border: none;
          background: transparent;
          transition: all 0.2s;
          letter-spacing: 0.1px;
        }
        .cobr-tab-active {
          background: #141917 !important;
          color: #00C896 !important;
          border: 1px solid rgba(0,200,150,0.2) !important;
        }

        /* FORM OVERRIDES */
        .cobr-form-space {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .cobr-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.79rem;
          font-weight: 500;
          color: #7A9087 !important;
          margin-bottom: 0.35rem;
        }
        .cobr-label svg {
          width: 13px;
          height: 13px;
          color: #5A7A70;
          flex-shrink: 0;
        }

        .cobr-input {
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          color: #F0F5F2 !important;
          font-size: 0.875rem !important;
          font-family: 'DM Sans', sans-serif !important;
          height: 42px !important;
          transition: border-color 0.2s !important;
        }
        .cobr-input:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
          outline: none !important;
        }
        .cobr-input::placeholder {
          color: #3A4A43 !important;
        }

        .cobr-pw-wrapper {
          position: relative;
        }
        .cobr-pw-wrapper .cobr-input {
          padding-right: 2.75rem !important;
        }
        .cobr-eye-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #3A4A43;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .cobr-eye-btn:hover { color: #00C896; }

        .cobr-submit-btn {
          width: 100%;
          background: #00C896 !important;
          color: #051A12 !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 0.8rem !important;
          font-family: 'Syne', sans-serif !important;
          font-size: 0.9rem !important;
          font-weight: 700 !important;
          margin-top: 0.25rem;
          transition: background 0.2s, transform 0.15s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
        }
        .cobr-submit-btn:hover:not(:disabled) {
          background: #00A87E !important;
          transform: translateY(-1px) !important;
        }
        .cobr-submit-btn:disabled {
          opacity: 0.7 !important;
        }

        .cobr-forgot {
          text-align: center;
          margin-top: 0.85rem;
          font-size: 0.79rem;
          color: #4A6A60;
          text-decoration: none;
          display: block;
          transition: color 0.2s;
        }
        .cobr-forgot:hover { color: #00C896; }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .cobr-auth-card {
            grid-template-columns: 1fr;
            min-height: unset;
          }
          .cobr-auth-left {
            padding: 2rem 1.5rem;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .cobr-left-body { padding: 1.5rem 0; }
          .cobr-auth-right { padding: 2rem 1.5rem; }
          .cobr-tagline { font-size: 1.35rem; }
        }
      `}</style>

      <div className="cobr-auth-root">
        <div className="cobr-auth-card">

          {/* ===== LEFT PANEL ===== */}
          <div className="cobr-auth-left">
            <div className="cobr-logo">
              <img src={CobrLogo} alt="Cobr" />
              cobr.
            </div>

            <div className="cobr-left-body">
              <h1 className="cobr-tagline">
                Cobranças que chegam<br />
                <span className="cobr-tagline-green">no lugar certo.</span>
              </h1>
              <p className="cobr-desc">
                Automatize seus recebimentos via WhatsApp, E-mail, SMS e reduza a inadimplência sem esforço.
              </p>
              <div className="cobr-feature-list">
                {FEATURES.map((f) => (
                  <div key={f} className="cobr-feature-item">
                    <CheckCircle2 />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <span className="cobr-footer-copy">© 2025 Cobr · Todos os direitos reservados</span>
          </div>

          {/* ===== RIGHT PANEL ===== */}
          <div className="cobr-auth-right">

            <div className="cobr-right-header">
              <div className="cobr-right-title">
                {tab === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
              </div>
              <div className="cobr-right-sub">
                {tab === "login"
                  ? "Entre na sua conta para continuar"
                  : "14 dias grátis, sem cartão de crédito"}
              </div>
            </div>

            {/* TABS */}
            <div className="cobr-tabs">
              <button
                type="button"
                className={`cobr-tab ${tab === "login" ? "cobr-tab-active" : ""}`}
                onClick={() => setTab("login")}
              >
                Entrar
              </button>
              <button
                type="button"
                className={`cobr-tab ${tab === "signup" ? "cobr-tab-active" : ""}`}
                onClick={() => setTab("signup")}
              >
                Criar conta
              </button>
            </div>

            {/* ===== LOGIN FORM ===== */}
            {tab === "login" && (
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit((data) => loginMutate(data))}
                  className="cobr-form-space"
                >
                  <FormField
                    name="email"
                    control={loginForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="cobr-label">
                          <Mail />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            className="cobr-input"
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
                        <FormLabel className="cobr-label">
                          <Lock />
                          Senha
                        </FormLabel>
                        <div className="cobr-pw-wrapper">
                          <FormControl>
                            <Input
                              type={showPasswordLogin ? "text" : "password"}
                              placeholder="••••••••"
                              className="cobr-input"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="cobr-eye-btn"
                            onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                          >
                            {showPasswordLogin
                              ? <EyeOff size={15} />
                              : <Eye size={15} />
                            }
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ButtonLoading
                    type="submit"
                    className="cobr-submit-btn"
                    isLoading={loginLoading}
                  >
                    Entrar no Cobr
                    <ArrowRight size={15} />
                  </ButtonLoading>

                  <a href="/forgot-password" className="cobr-forgot">
                    Esqueceu sua senha?
                  </a>
                </form>
              </Form>
            )}

            {/* ===== SIGNUP FORM ===== */}
            {tab === "signup" && (
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit((data) => signupMutate(data))}
                  className="cobr-form-space"
                >
                  <FormField
                    name="name"
                    control={signupForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="cobr-label">
                          <User size={13} />
                          Nome completo
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Seu nome"
                            className="cobr-input"
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
                        <FormLabel className="cobr-label">
                          <Mail size={13} />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            className="cobr-input"
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
                        <FormLabel className="cobr-label">
                          <Lock size={13} />
                          Senha
                        </FormLabel>
                        <div className="cobr-pw-wrapper">
                          <FormControl>
                            <Input
                              type={showPasswordSignup ? "text" : "password"}
                              placeholder="••••••••"
                              className="cobr-input"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="cobr-eye-btn"
                            onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                          >
                            {showPasswordSignup
                              ? <EyeOff size={15} />
                              : <Eye size={15} />
                            }
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="confirmPassword"
                    control={signupForm.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="cobr-label">
                          <Lock size={13} />
                          Confirmar Senha
                        </FormLabel>
                        <div className="cobr-pw-wrapper">
                          <FormControl>
                            <Input
                              type={showConfirmPasswordSignup ? "text" : "password"}
                              placeholder="••••••••"
                              className="cobr-input"
                              {...field}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="cobr-eye-btn"
                            onClick={() => setShowConfirmPasswordSignup(!showConfirmPasswordSignup)}
                          >
                            {showConfirmPasswordSignup
                              ? <EyeOff size={15} />
                              : <Eye size={15} />
                            }
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   <FormField
                    name="acceptedTerms"
                    control={signupForm.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-white/5 border border-white/5">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-white/20 data-[state=checked]:bg-[#00C896] data-[state=checked]:text-[#051A12]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-[0.75rem] font-medium text-[#7A9087] leading-relaxed cursor-pointer">
                            Eu aceito os <a href="/terms" target="_blank" className="text-[#00C896] hover:underline">Termos de Uso</a> e a <a href="/privacy" target="_blank" className="text-[#00C896] hover:underline">Política de Privacidade</a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <ButtonLoading
                    type="submit"
                    className="cobr-submit-btn"
                    isLoading={signupLoading}
                  >
                    Criar minha conta
                    <ArrowRight size={15} />
                  </ButtonLoading>
                </form>
              </Form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}