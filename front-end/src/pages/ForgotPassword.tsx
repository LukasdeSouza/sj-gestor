import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { fetchUseQuery, ApiErrorQuery } from "@/api/services/fetchUseQuery";
import { handleErrorMessages } from "@/errors/handleErrorMessage";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import ButtonLoading from "@/components/ButtonLoading";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CobrLogo from "../assets/logo.png";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { ArrowLeft, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();

  useAuthRedirect({ condition: "if-authenticated", redirectTo: "/dashboard" });

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
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
      setTimeout(() => navigate("/auth"), 2000);
    },
    onError: (error: ApiErrorQuery) => {
      if (Array.isArray(error.errors)) {
        handleErrorMessages(error.errors);
      } else {
        toast.error(error.message || "Erro ao enviar email de recuperação");
      }
    },
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .cobr-fp-root {
          min-height: 100vh;
          background: #090C0A;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        .cobr-fp-card {
          width: 100%;
          max-width: 420px;
          background: #0D1210;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          position: relative;
        }

        .cobr-fp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,200,150,0.4), transparent);
        }

        .cobr-fp-glow {
          position: absolute;
          bottom: -120px;
          right: -80px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,200,150,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .cobr-fp-inner {
          padding: 2.5rem 2.25rem 2.25rem;
          position: relative;
          z-index: 1;
        }

        .cobr-fp-logo-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2.25rem;
        }
        .cobr-fp-logo-wrap img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }
        .cobr-fp-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #00C896;
          letter-spacing: -0.4px;
        }

        .cobr-fp-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(0,200,150,0.1);
          border: 1px solid rgba(0,200,150,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          color: #00C896;
        }

        .cobr-fp-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #F0F5F2;
          letter-spacing: -0.5px;
          margin-bottom: 0.4rem;
        }

        .cobr-fp-desc {
          font-size: 0.85rem;
          color: #6A8A80;
          line-height: 1.65;
          margin-bottom: 2rem;
        }

        .cobr-fp-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.79rem;
          font-weight: 500;
          color: #7A9087 !important;
          margin-bottom: 0.35rem;
        }
        .cobr-fp-label svg {
          width: 13px;
          height: 13px;
          color: #5A7A70;
          flex-shrink: 0;
        }

        .cobr-fp-input {
          background: #111614 !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
          color: #F0F5F2 !important;
          font-size: 0.875rem !important;
          font-family: 'DM Sans', sans-serif !important;
          height: 42px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .cobr-fp-input:focus {
          border-color: rgba(0,200,150,0.4) !important;
          box-shadow: 0 0 0 3px rgba(0,200,150,0.06) !important;
          outline: none !important;
        }
        .cobr-fp-input::placeholder { color: #3A4A43 !important; }

        .cobr-fp-btn {
          width: 100%;
          background: #00C896 !important;
          color: #051A12 !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 0.8rem !important;
          font-family: 'Syne', sans-serif !important;
          font-size: 0.9rem !important;
          font-weight: 700 !important;
          margin-top: 1.25rem;
          transition: background 0.2s, transform 0.15s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
        }
        .cobr-fp-btn:hover:not(:disabled) {
          background: #00A87E !important;
          transform: translateY(-1px) !important;
        }
        .cobr-fp-btn:disabled { opacity: 0.7 !important; }

        .cobr-fp-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 1.5rem 0;
        }

        .cobr-fp-back {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #4A6A60;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
          padding: 0.25rem;
        }
        .cobr-fp-back:hover { color: #00C896; }
        .cobr-fp-back svg { width: 14px; height: 14px; }
      `}</style>

      <div className="cobr-fp-root">
        <div className="cobr-fp-card">
          <div className="cobr-fp-glow" />

          <div className="cobr-fp-inner">
            {/* Logo */}
            <div className="cobr-fp-logo-wrap">
              <img src={CobrLogo} alt="Cobr" />
              <span className="cobr-fp-logo-text">cobr.</span>
            </div>

            {/* Icon + Header */}
            <div className="cobr-fp-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <h2 className="cobr-fp-title">Recuperar senha</h2>
            <p className="cobr-fp-desc">
              Informe seu email e enviaremos um link para você criar uma nova senha.
            </p>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutate(data))}>
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="cobr-fp-label">
                        <Mail />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          id="forgot-email"
                          placeholder="seu@email.com"
                          className="cobr-fp-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ButtonLoading
                  type="submit"
                  className="cobr-fp-btn"
                  isLoading={isPending}
                >
                  Enviar link de recuperação
                  <ArrowRight size={15} />
                </ButtonLoading>
              </form>
            </Form>

            <div className="cobr-fp-divider" />

            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="cobr-fp-back"
            >
              <ArrowLeft />
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}