import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CobrLogo from "../assets/logo.png";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Eye, EyeOff, LockKeyhole, AlertCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      return await fetchUseQuery<{ token: string; password: string }, { message: string }>({
        route: "/auth/reset-password",
        method: "POST",
        data: { token: token!, password: data.password },
      });
    },
    onSuccess: (res) => {
      toast.success(res.message || "Senha alterada com sucesso!");
      form.reset();
      setTimeout(() => navigate("/auth"), 2500);
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) handleErrorMessages(error.errors);
      else toast.error(error.message || "Erro ao alterar senha");
    },
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .cobr-rp-root {
          min-height: 100vh;
          background: #090C0A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }
        .cobr-rp-card {
          width: 100%;
          max-width: 420px;
          background: #0D1210;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          position: relative;
        }
        .cobr-rp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,200,150,0.4), transparent);
        }
        .cobr-rp-inner { padding: 2.5rem 2.25rem 2.25rem; position: relative; z-index: 1; }
        .cobr-rp-logo-wrap { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
        .cobr-rp-logo-wrap img { width: 28px; height: 28px; object-fit: contain; }
        .cobr-rp-logo-text { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 800; color: #00C896; letter-spacing: -0.4px; }
        .cobr-rp-icon-wrap {
          width: 48px; height: 48px; border-radius: 12px;
          background: rgba(0,200,150,0.1); border: 1px solid rgba(0,200,150,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.25rem; color: #00C896;
        }
        .cobr-rp-title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 800; color: #F0F5F2; letter-spacing: -0.5px; margin-bottom: 0.4rem; }
        .cobr-rp-desc { font-size: 0.85rem; color: #6A8A80; line-height: 1.65; margin-bottom: 2rem; }
        .cobr-rp-label { font-size: 0.79rem; font-weight: 500; color: #7A9087 !important; margin-bottom: 0.35rem; }
        .cobr-rp-input-wrap { position: relative; }
        .cobr-rp-input {
          background: #111614 !important; border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important; color: #F0F5F2 !important;
          font-size: 0.875rem !important; font-family: 'DM Sans', sans-serif !important;
          height: 42px !important; transition: border-color 0.2s, box-shadow 0.2s !important;
          padding-right: 44px !important;
        }
        .cobr-rp-input:focus { border-color: rgba(0,200,150,0.4) !important; box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important; outline: none !important; }
        .cobr-rp-input::placeholder { color: #3A4A43 !important; }
        .cobr-rp-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #3A5A50; transition: color 0.15s; }
        .cobr-rp-eye:hover { color: #00C896; }
        .cobr-rp-btn {
          width: 100%; background: #00C896 !important; color: #051A12 !important;
          border: none !important; border-radius: 8px !important; padding: 0.8rem !important;
          font-family: 'Syne', sans-serif !important; font-size: 0.9rem !important; font-weight: 700 !important;
          margin-top: 1.25rem; transition: background 0.2s, transform 0.15s !important;
          display: flex !important; align-items: center !important; justify-content: center !important; gap: 0.5rem !important;
        }
        .cobr-rp-btn:hover:not(:disabled) { background: #00A87E !important; transform: translateY(-1px) !important; }
        .cobr-rp-btn:disabled { opacity: 0.7 !important; }
        .cobr-rp-alert {
          display: flex; gap: 10px; align-items: flex-start;
          background: rgba(232,69,69,0.07); border: 1px solid rgba(232,69,69,0.2);
          border-radius: 10px; padding: 12px 14px; margin-bottom: 1.5rem;
          font-size: 13px; color: #E84545; line-height: 1.5;
        }
      `}</style>

      <div className="cobr-rp-root">
        <div className="cobr-rp-card">
          <div className="cobr-rp-inner">
            {/* Logo */}
            <div className="cobr-rp-logo-wrap">
              <img src={CobrLogo} alt="Cobr" />
              <span className="cobr-rp-logo-text">cobr.</span>
            </div>

            {/* Icon + Header */}
            <div className="cobr-rp-icon-wrap">
              <LockKeyhole size={22} />
            </div>
            <h2 className="cobr-rp-title">Nova senha</h2>
            <p className="cobr-rp-desc">Digite e confirme sua nova senha abaixo.</p>

            {/* Token inválido */}
            {!token && (
              <div className="cobr-rp-alert">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Link inválido. Solicite uma nova recuperação de senha na tela de login.</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => mutate(d))} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="cobr-rp-label">Nova senha</FormLabel>
                      <div className="cobr-rp-input-wrap">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="cobr-rp-input"
                            {...field}
                          />
                        </FormControl>
                        <button type="button" className="cobr-rp-eye" onClick={() => setShowPassword(v => !v)}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                      <FormLabel className="cobr-rp-label">Confirmar nova senha</FormLabel>
                      <div className="cobr-rp-input-wrap">
                        <FormControl>
                          <Input
                            type={showConfirm ? "text" : "password"}
                            placeholder="••••••••"
                            className="cobr-rp-input"
                            {...field}
                          />
                        </FormControl>
                        <button type="button" className="cobr-rp-eye" onClick={() => setShowConfirm(v => !v)}>
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ButtonLoading
                  type="submit"
                  className="cobr-rp-btn"
                  isLoading={isPending}
                  disabled={!token || isPending}
                >
                  Redefinir senha
                </ButtonLoading>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
