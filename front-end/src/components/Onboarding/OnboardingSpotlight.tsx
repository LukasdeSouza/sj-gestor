import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "./TourProvider";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";

export function OnboardingSpotlight() {
  const {
    currentTourStep,
    currentStepData,
    isLastStep,
    isFirstStep,
    handleNext,
    handleBack,
    steps,
    isTourActive,
    endTour,
    completeStep
  } = useTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isTourActive) {
      setIsVisible(false);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(currentStepData.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    updateRect();

    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const interval = setInterval(updateRect, 500);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearInterval(interval);
    };
  }, [isTourActive, currentStepData.targetId]);

  if (!isTourActive || !isVisible || !targetRect) return null;

  const currentStepNumber = currentTourStep + 1;
  const totalSteps = steps.length;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "auto" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.x - 10}
              y={targetRect.y - 10}
              width={targetRect.width + 20}
              height={targetRect.height + 20}
              rx="14"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.82)"
          mask="url(#spotlight-mask)"
          style={{ cursor: "default" }}
        />
      </svg>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "absolute",
          top: targetRect.y - 10,
          left: targetRect.x - 10,
          width: targetRect.width + 20,
          height: targetRect.height + 20,
          border: "2.5px solid #00C896",
          borderRadius: 14,
          boxShadow: "0 0 30px rgba(0,200,150,0.4)",
          pointerEvents: "none",
        }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepData.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          style={{
            position: "absolute",
            top: targetRect.y + targetRect.height + 30,
            left: Math.min(
              window.innerWidth - 340,
              Math.max(20, targetRect.x + targetRect.width / 2 - 160)
            ),
            width: 320,
            background: "#111614",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "1.75rem",
            boxShadow: "0 32px 64px -16px rgba(0,0,0,0.8)",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#00C896" }}>
              <div style={{
                background: "rgba(0,200,150,0.1)",
                borderRadius: "50%",
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Sparkles size={14} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "'Syne', sans-serif" }}>
                PASSO {currentStepNumber} DE {totalSteps}
              </span>
            </div>
            <button
              onClick={endTour}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#3A5A50", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E84545")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3A5A50")}
            >
              <X size={18} />
            </button>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800, color: "#F0F5F2", marginBottom: "0.5rem", letterSpacing: -0.3 }}>
              {currentStepData.title}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#7A9087", lineHeight: 1.6 }}>
              {currentStepData.content}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "0.5rem 0.8rem",
                fontSize: "0.8rem", fontWeight: 600, color: isFirstStep ? "#2A4A40" : "#C0D5CC",
                cursor: isFirstStep ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <ChevronLeft size={16} /> Voltar
            </button>

            <button
              onClick={() => {
                if (currentStepData.id !== "dashboard") {
                  completeStep(currentStepData.id as any);
                }
                handleNext();
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#00C896", border: "none",
                borderRadius: 10, padding: "0.5rem 1.25rem",
                fontSize: "0.82rem", fontWeight: 700, color: "#051A12",
                cursor: "pointer", transition: "transform 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#00A87E")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#00C896")}
            >
              {isLastStep ? "Concluir Tour" : "Próximo Passo"}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}
