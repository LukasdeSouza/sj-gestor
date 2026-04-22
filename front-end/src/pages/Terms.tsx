import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050807] text-[#C0D5CC] selection:bg-[#00C896]/30 selection:text-white pb-20">
      <header className="sticky top-0 z-50 bg-[#050807]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium hover:text-[#00C896] transition-colors"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C896] to-[#008F6B] flex items-center justify-center">
              <FileText size={18} className="text-[#050807]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Cobr</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Termos de Uso</h1>
          <p className="text-[#7A9087] mb-12 font-medium">Versão 1.0 — {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="prose prose-invert prose-emerald max-w-none space-y-10 text-lg leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center text-sm">01</span>
                Aceitação dos Termos
              </h2>
              <p>
                Ao criar uma conta no Cobr, você concorda em cumprir estes Termos de Uso. O Cobr é uma ferramenta de automação de cobranças via WhatsApp e PIX, e o uso da plataforma implica na aceitação integral destas condições.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center text-sm">02</span>
                Responsabilidade do Usuário
              </h2>
              <p>
                Você é o único responsável por:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-[#C0D5CC]">
                <li>A veracidade dos dados dos seus clientes cadastrados.</li>
                <li>O conteúdo das mensagens enviadas via WhatsApp.</li>
                <li>Garantir que possui autorização dos seus clientes para enviar notificações de cobrança.</li>
                <li>Manter a segurança de sua senha e dados de acesso.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center text-sm">03</span>
                Serviços de Terceiros (WhatsApp e PIX)
              </h2>
              <p>
                A plataforma Cobr integra-se a serviços de terceiros. Não nos responsabilizamos por instabilidades no WhatsApp (Meta Inc.) ou em redes de processamento PIX dos bancos. O uso desses serviços está sujeito aos termos de seus respectivos provedores.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center text-sm">04</span>
                Pagamentos e Planos
              </h2>
              <p>
                O acesso a recursos avançados requer a adesão a um dos nossos planos pagos. Ao assinar, você autoriza a cobrança periódica conforme o modelo escolhido. O não pagamento resultará na suspensão das automações e acesso limitado à plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center text-sm">05</span>
                Proibições e Conduta Ética
              </h2>
              <p>
                É estritamente proibido usar a plataforma para:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-[#C0D5CC]">
                <li>Envio de SPAM ou mensagens abusivas/ameaçadoras.</li>
                <li>Atividades ilícitas, lavagem de dinheiro ou fraudes financeiras.</li>
                <li>Tentativas de engenharia reversa ou hacking da plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#00C896]/10 flex items-center justify-center text-sm">06</span>
                Rescisão e Cancelamento
              </h2>
              <p>
                Você pode cancelar sua assinatura a qualquer momento através do painel de controle. Reservamo-nos o direito de suspender contas que violem estes termos, sem previo aviso, para garantir a integridade do ecossistema.
              </p>
            </section>

            <footer className="pt-16 border-t border-white/5 text-sm text-[#3A5A50] text-center">
              <p>© {new Date().getFullYear()} Cobr Automation. Desenvolvido por CodeTech Software.</p>
            </footer>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Terms;
