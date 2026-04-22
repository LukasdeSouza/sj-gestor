import React from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { toast } from "sonner";
import { useState } from "react";

const VerifyEmailNotice: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(Cookies.get('user') || '{}');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    navigate('/auth');
  };

  const handleResend = async () => {
    if (isResending || countdown > 0) return;
    setIsResending(true);
    try {
      await fetchUseQuery({
        route: "/auth/resend-verification",
        method: "POST",
        data: { email: user.email },
      });
      toast.success("E-mail de verificação reenviado com sucesso!");
      setCountdown(45);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao reenviar e-mail de verificação.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050807] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00C896]/10 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#0D1210]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-[#00C896] to-transparent opacity-50" />

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-[#00C896]/10 flex items-center justify-center relative">
            <Mail size={40} className="text-[#00C896]" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-[#00C896] blur-2xl -z-10"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Verifique seu e-mail</h1>
            <p className="text-[#7A9087] text-lg leading-relaxed">
              Enviamos um link de confirmação para <span className="text-[#C0D5CC] font-semibold">{user.email}</span>.
            </p>
          </div>

          <div className="w-full space-y-4 pt-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-[#7A9087] font-light">
              Confira sua caixa de entrada e spam. O link expira em breve.
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                <RefreshCw size={16} className={isResending ? "animate-spin" : ""} /> 
                {isResending ? "Enviando..." : countdown > 0 ? `${countdown}s` : "Reenviar"}
              </button>
              <button 
                onClick={handleLogout}
                className="py-3 px-4 bg-transparent hover:bg-red-500/10 text-[#7A9087] hover:text-red-400 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailNotice;
