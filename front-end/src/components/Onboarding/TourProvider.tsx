import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";

interface TourStep {
  id: string;
  targetId: string;
  title: string;
  content: string;
  path: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    targetId: "dashboard-analytics",
    title: "Bem-vindo ao CoBr!",
    content: "Este é o seu centro de comando. Aqui você acompanha suas métricas de faturamento e o status das suas cobranças em tempo real.",
    path: "/dashboard",
  },
  {
    id: "whatsapp",
    targetId: "btn-connect-whatsapp",
    title: "Vincule seu WhatsApp",
    content: "O coração do CoBr. Conecte seu número para que possamos enviar os lembretes e chaves PIX automaticamente para seus clientes.",
    path: "/whatsapp",
  },
  {
    id: "products",
    targetId: "btn-new-product",
    title: "Cadastre seus Produtos",
    content: "Defina o que você vende e quanto custa. Isso facilita a criação de cobranças recorrentes ou avulsas.",
    path: "/products",
  },
  {
    id: "pix",
    targetId: "btn-new-pix",
    title: "Configure seus Meios de Pagamento",
    content: "Cadastre suas chaves PIX e também seus links de checkout (cartão e boleto) para oferecer múltiplas formas de pagamento aos seus clientes.",
    path: "/meios-pagamento",
  },
  {
    id: "templates",
    targetId: "btn-new-template",
    title: "Personalize suas Mensagens",
    content: "Crie modelos de mensagens automáticas que soam como você. Use variáveis para inserir o nome e valor do cliente.",
    path: "/templates",
  },
  {
    id: "clients",
    targetId: "btn-new-client",
    title: "Sua Primeira Cobrança",
    content: "Tudo pronto! Agora é só cadastrar seu cliente e deixar que a régua de cobrança automática faça o trabalho por você.",
    path: "/clients",
  },
];

interface TourContextType {
  steps: TourStep[];
  currentStepData: TourStep;
  isLastStep: boolean;
  isFirstStep: boolean;
  handleNext: () => void;
  handleBack: () => void;
  isTourActive: boolean;
  startTour: () => void;
  endTour: () => void;
  completeStep: (step: any) => void;
  totalCompleted: number;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { 
    isTourActive, 
    currentTourStep, 
    nextStep, 
    prevStep, 
    endTour, 
    startTour, 
    completeStep, 
    totalCompleted 
  } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  const currentStepData = TOUR_STEPS[currentTourStep] || TOUR_STEPS[0];
  const isLastStep = currentTourStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentTourStep === 0;

  // Auto-navigation when step changes
  useEffect(() => {
    if (isTourActive && location.pathname !== currentStepData.path) {
      navigate(currentStepData.path);
    }
  }, [currentTourStep, isTourActive, navigate, currentStepData.path, location.pathname]);

  const handleNext = () => {
    if (isLastStep) {
      endTour();
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      prevStep();
    }
  };

  return (
    <TourContext.Provider
      value={{
        steps: TOUR_STEPS,
        currentStepData,
        isLastStep,
        isFirstStep,
        handleNext,
        handleBack,
        isTourActive,
        startTour,
        endTour,
        completeStep,
        totalCompleted
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
