import { CheckCircle2, Circle, Smartphone, CreditCard, Package, FileText, Users, ChevronRight, Sparkles } from "lucide-react";
import { useOnboarding, OnboardingStep } from "@/hooks/useOnboarding";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const STEPS: { id: OnboardingStep; label: string; icon: any; path: string }[] = [
  { id: "whatsapp", label: "Conectar WhatsApp",         icon: Smartphone,  path: "/settings?tour=whatsapp" },
  { id: "pix",      label: "Configurar Chave PIX",      icon: CreditCard,  path: "/settings?tour=pix"      },
  { id: "product",  label: "Cadastrar seu Produto",      icon: Package,     path: "/settings?tour=product"  },
  { id: "template", label: "Criar Template de Mensagem", icon: FileText,    path: "/settings?tour=template" },
  { id: "client",   label: "Cadastrar Primeiro Cliente", icon: Users,       path: "/clients?tour=client"   },
];

export function OnboardingChecklist() {
  const { steps, progress, totalCompleted, isCompleted } = useOnboarding();
  const navigate = useNavigate();

  if (totalCompleted === 5) return null;

  return (
    <div style={{
      background: "linear-gradient(145deg, rgba(0,200,150,0.05) 0%, rgba(9,12,10,1) 100%)",
      border: "1px solid rgba(0,200,150,0.2)",
      borderRadius: 16,
      padding: "1.5rem",
      marginBottom: "2rem",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      animation: "fadeIn 0.5s ease"
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ob-step-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.85rem; border-radius: 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .ob-step-item:hover { background: rgba(255,255,255,0.04); border-color: rgba(0,200,150,0.3); }
        .ob-step-item.completed { opacity: 0.6; grayscale: 1; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "#F0F5F2", display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={20} color="#00C896" />
            Guia de Configuração
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#6A8A80", marginTop: 4 }}>
            Siga os passos abaixo para ativar sua primeira régua de cobrança automática.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#00C896", textTransform: "uppercase", marginBottom: 6 }}>
            {totalCompleted} / 5 Concluídos
          </div>
          <div style={{ width: 120 }}>
            <Progress value={progress} style={{ height: 6, background: "rgba(255,255,255,0.05)" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {STEPS.map((step) => {
          const completed = isCompleted(step.id);
          return (
            <div 
              key={step.id} 
              className={`ob-step-item ${completed ? 'completed' : ''}`}
              onClick={() => !completed && navigate(step.path)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: completed ? "rgba(0,200,150,0.1)" : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <step.icon size={16} color={completed ? "#00C896" : "#5A7A70"} />
                </div>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: completed ? "#00C896" : "#C0D5CC" }}>
                  {step.label}
                </span>
              </div>
              {completed ? (
                <CheckCircle2 size={16} color="#00C896" />
              ) : (
                <ChevronRight size={14} color="#3A5A50" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
