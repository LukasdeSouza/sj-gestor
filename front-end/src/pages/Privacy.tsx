import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, Eye, Server, Database, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Shield className="text-[#00C896]" size={20} />,
      title: "1. Compromisso com a Privacidade",
      content: "No Cobr, a privacidade e a segurança dos seus dados são nossa prioridade absoluta. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais e os dados dos seus clientes em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)."
    },
    {
      icon: <Database className="text-[#00C896]" size={20} />,
      title: "2. Coleta de Dados e Finalidade",
      content: "Coletamos apenas as informações estritamente necessárias para a prestação dos nossos serviços de automação de cobranças:",
      list: [
        "Dados cadastrais do Usuário: Nome, e-mail, telefone e informações de faturamento.",
        "Dados dos Clientes do Usuário: Nome, contato (WhatsApp/E-mail) e informações de dívidas para fins de notificação.",
        "Logs de Acesso: Endereço IP, tipo de navegador e horários de interação para segurança e auditoria."
      ]
    },
    {
      icon: <Lock className="text-[#00C896]" size={20} />,
      title: "3. Segurança e Armazenamento",
      content: "Utilizamos infraestrutura de nuvem de classe mundial com criptografia de ponta a ponta (SSL/TLS). Seus dados são armazenados em servidores seguros com controle de acesso rigoroso. Não armazenamos senhas em texto plano — utilizamos algoritmos de hash de alta segurança."
    },
    {
      icon: <Globe className="text-[#00C896]" size={20} />,
      title: "4. Compartilhamento com Terceiros",
      content: "O Cobr não vende, aluga ou compartilha seus dados pessoais para fins de marketing. O compartilhamento ocorre apenas com parceiros essenciais para a operação do sistema, como:",
      list: [
        "Provedores de infraestrutura (AWS/Google Cloud).",
        "Gateways de pagamento (Mercado Pago, Stripe, Pagar.me) para processamento de transações.",
        "APIs de comunicação (WhatsApp Business API) para envio de notificações."
      ]
    },
    {
      icon: <Eye className="text-[#00C896]" size={20} />,
      title: "5. Seus Direitos",
      content: "De acordo com a LGPD, você possui o direito de: confirmar a existência de tratamento de dados; acessar seus dados; corrigir dados incompletos ou inexatos; solicitar a anonimização ou exclusão de dados desnecessários; e revogar seu consentimento a qualquer momento."
    },
    {
      icon: <Server className="text-[#00C896]" size={20} />,
      title: "6. Retenção de Dados",
      content: "Mantemos seus dados apenas pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por obrigações legais e regulatórias. Após o cancelamento da conta, os dados são excluídos ou anonimizados dentro de um prazo razoável."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1E293B] selection:bg-[#00C896]/20 pb-20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#00C896] transition-all"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C896] to-[#008F6B] flex items-center justify-center shadow-lg shadow-[#00C896]/20">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">cobr<span className="text-[#00C896]">.</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Política de Privacidade</h1>
            <p className="text-slate-500 font-medium">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="space-y-12">
            {sections.map((section, idx) => (
              <motion.section 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#00C896]/10 flex items-center justify-center">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{section.title}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed text-lg mb-4">
                  {section.content}
                </p>
                {section.list && (
                  <ul className="grid gap-3 pl-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 text-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00C896] mt-2.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>
            ))}

            <footer className="pt-12 border-t border-slate-200 text-center">
              <p className="text-slate-500 mb-2">Dúvidas sobre sua privacidade?</p>
              <a 
                href="mailto:suporte@codetechsoftware.com.br"
                className="text-[#00C896] font-bold hover:underline text-lg"
              >
                suporte@codetechsoftware.com.br
              </a>
              <p className="text-slate-400 text-sm mt-8">
                © {new Date().getFullYear()} Cobr Automation. Todos os direitos reservados.
              </p>
            </footer>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Privacy;

