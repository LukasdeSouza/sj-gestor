import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, CheckCircle2, AlertCircle, Scale, CreditCard, Ban, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <CheckCircle2 className="text-[#00C896]" size={20} />,
      title: "1. Aceitação dos Termos",
      content: "Ao acessar e utilizar a plataforma Cobr, você concorda em cumprir estes Termos de Uso. Este documento constitui um contrato vinculativo entre você (Usuário) e a Cobr Automation. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços."
    },
    {
      icon: <Scale className="text-[#00C896]" size={20} />,
      title: "2. Descrição do Serviço",
      content: "O Cobr é uma solução SaaS (Software as a Service) voltada para a automação de cobranças financeiras, permitindo o envio de notificações via WhatsApp, e-mail e SMS, além da gestão de recebíveis via PIX e outros métodos integrados."
    },
    {
      icon: <AlertCircle className="text-[#00C896]" size={20} />,
      title: "3. Responsabilidades do Usuário",
      content: "O Usuário é o único responsável por:",
      list: [
        "Manter a confidencialidade de suas credenciais de acesso.",
        "Garantir a veracidade e legalidade dos dados de seus clientes cadastrados na plataforma.",
        "Obter o consentimento prévio de seus clientes para o envio de mensagens de cobrança, respeitando as normas de SPAM e a LGPD.",
        "Não utilizar a plataforma para atividades ilícitas, fraudulentas ou que violem direitos de terceiros."
      ]
    },
    {
      icon: <CreditCard className="text-[#00C896]" size={20} />,
      title: "4. Planos e Pagamentos",
      content: "O acesso a determinadas funcionalidades depende da assinatura de um plano. Os pagamentos são recorrentes e processados via gateways parceiros. Em caso de inadimplência do Usuário, o Cobr reserva-se o direito de suspender o acesso aos serviços até a regularização.",
    },
    {
      icon: <Ban className="text-[#00C896]" size={20} />,
      title: "5. Propriedade Intelectual",
      content: "Todos os direitos de propriedade intelectual sobre a plataforma, incluindo código-fonte, design, logotipos e conteúdos originais, pertencem exclusivamente à Cobr Automation ou à Codetech Software. É proibida qualquer tentativa de engenharia reversa ou reprodução não autorizada."
    },
    {
      icon: <Trash2 className="text-[#00C896]" size={20} />,
      title: "6. Rescisão",
      content: "Você pode cancelar sua assinatura a qualquer momento através do painel de controle. O Cobr poderá encerrar ou suspender sua conta imediatamente, sem aviso prévio, caso haja violação destes Termos de Uso ou suspeita de uso fraudulento."
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
              <FileText size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">cobr<span className="text-[#00C896]">.</span></span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Termos de Uso</h1>
            <p className="text-slate-500 font-medium">Versão 1.2 — {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <motion.section 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
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

            <footer className="pt-16 border-t border-slate-200 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-500 text-sm font-medium mb-6">
                <AlertCircle size={14} />
                Estes termos podem ser atualizados sem aviso prévio.
              </div>
              <p className="text-slate-400 text-sm">
                © {new Date().getFullYear()} Cobr Automation. Desenvolvido por <a href="https://codetechsoftware.com.br" className="hover:text-[#00C896] font-semibold">CodeTech Software</a>.
              </p>
            </footer>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Terms;

