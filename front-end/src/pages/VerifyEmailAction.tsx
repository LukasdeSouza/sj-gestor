import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchUseQuery } from '@/api/services/fetchUseQuery';
const VerifyEmailAction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu e-mail...');

  const token = searchParams.get('token');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificação não encontrado.');
        return;
      }

      try {
        const response: any = await fetchUseQuery({
          route: `/auth/verify-email?token=${token}`,
          method: 'GET'
        });

        if (response.error) {
          setStatus('error');
          setMessage(response.message || 'Ocorreu um erro ao verificar seu e-mail.');
        } else {
          localStorage.setItem('cobr_first_time', 'true');
          setStatus('success');
          setMessage('Sua conta foi ativada com sucesso! Bem-vindo ao Cobr.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Falha na comunicação com o servidor.');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#050807] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#00C896]/10 via-transparent to-transparent">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0D1210]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden text-center"
      >
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-8"
            >
              <div className="relative w-20 h-20 mx-auto">
                <Loader2 className="w-20 h-20 text-[#00C896] animate-spin" strokeWidth={1} />
                <div className="absolute inset-0 bg-[#00C896] blur-3xl opacity-20" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{message}</h2>
              <p className="text-[#7A9087]">Por favor, aguarde enquanto validamos seu cadastro.</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 py-4"
            >
              <div className="w-24 h-24 rounded-full bg-[#00C896]/10 flex items-center justify-center mx-auto ring-1 ring-[#00C896]/30">
                <CheckCircle2 size={48} className="text-[#00C896]" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">E-mail Confirmado! </h2>
                <p className="text-sm font-light text-[#C0D5CC] leading-relaxed px-4">{message}</p>
              </div>
              <button
                onClick={() => navigate('/plans')}
                className="w-full py-5 bg-[#00C896] hover:bg-[#00E0A8] text-[#051A12] font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl hover:shadow-[#00C896]/30 flex items-center justify-center gap-3 active:scale-95 group"
              >
                Acessar Sistema <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 py-4"
            >
              <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mx-auto ring-1 ring-red-500/30">
                <XCircle size={48} className="text-red-500" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Ops!</h2>
                <p className="text-lg text-[#C0D5CC] leading-relaxed px-4">{message}</p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-3 active:scale-95"
                >
                  Voltar para o Login
                </button>
                <p className="text-sm text-[#7A9087]">
                  Se o erro persistir, tente reenviar o e-mail de confirmação.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VerifyEmailAction;
