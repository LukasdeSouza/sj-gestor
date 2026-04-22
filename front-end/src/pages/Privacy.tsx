import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050807] text-[#C0D5CC] selection:bg-[#00C896]/30 selection:text-white pb-20">
      {/* Header */}
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
              <Shield size={18} className="text-[#050807]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Cobr</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Política de Privacidade</h1>
          <p className="text-[#7A9087] mb-12">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

          <div className="prose prose-invert prose-emerald max-w-none space-y-8 text-lg leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">1. Introdução</h2>
              <p>
                O Cobr ("nós", "nosso" ou "plataforma") está comprometido em proteger a sua privacidade. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações pessoais ao utilizar nossos serviços de automação de cobranças e gestão financeira.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">2. Coleta de Dados</h2>
              <p>Coletamos informações que você nos fornece diretamente ao:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Criar uma conta (nome, e-mail, senha criptografada).</li>
                <li>Configurar seu perfil de faturamento (dados PIX, chaves).</li>
                <li>Cadastrar seus clientes (nome, documento, contato, e-mail).</li>
                <li>Processar transações e histórico de cobranças.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">3. Uso das Informações</h2>
              <p>Utilizamos os dados coletados para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Prover e manter os serviços de automação de cobranças.</li>
                <li>Enviar notificações de pagamento e lembretes aos seus clientes em seu nome.</li>
                <li>Processar pagamentos via PIX e outros métodos integrados.</li>
                <li>Garantir a segurança da plataforma e prevenir fraudes.</li>
                <li>Cumprir obrigações legais e fiscais.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">4. Segurança de Dados</h2>
              <p>
                Implementamos medidas técnicas e organizacionais de última geração para proteger seus dados, incluindo criptografia SSL/TLS, firewalls e controles de acesso estritos. Seus dados de pagamento são processados de forma segura e não armazenamos senhas em texto puro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">5. Compartilhamento com Terceiros</h2>
              <p>
                Não vendemos seus dados pessoais. Compartilhamos informações apenas com parceiros essenciais para o funcionamento do serviço (ex: gateways de pagamento como Mercado Pago/Stripe, serviços de envio de e-mail e provedores de infraestrutura em nuvem), sempre sob estrita confidencialidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">6. Seus Direitos (LGPD)</h2>
              <p>
                Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, excluir ou portar seus dados a qualquer momento através das configurações da sua conta ou entrando em contato com nosso suporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#00C896] mb-4">7. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos você sobre mudanças significativas através do e-mail cadastrado ou por um aviso em destaque na nossa plataforma.
              </p>
            </section>

            <footer className="pt-12 border-t border-white/5 text-sm text-[#3A5A50]">
              <p>Dúvidas sobre sua privacidade? Entre em contato: suporte@codetechsoftware.com.br</p>
            </footer>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Privacy;
