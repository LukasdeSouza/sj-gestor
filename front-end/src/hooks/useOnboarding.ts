import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUseQuery } from "@/api/services/fetchUseQuery";
import { useState, useEffect } from "react";

export type OnboardingStep = "whatsapp" | "pix" | "product" | "template" | "client";

export function useOnboarding() {
  const queryClient = useQueryClient();

  const { data: steps = [], isLoading } = useQuery<OnboardingStep[]>({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const res = await fetchUseQuery<undefined, OnboardingStep[]>({ route: "/onboarding", method: "GET" });
      return res || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const completeStep = useMutation({
    mutationFn: async (step: OnboardingStep) => {
      return await fetchUseQuery<{ step: OnboardingStep }, OnboardingStep[]>({
        route: "/onboarding/step",
        method: "POST",
        data: { step }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    }
  });

  // ── TOUR STATE ─────────────────────────────────────────────────────────────
  const [isTourActive, setIsTourActive] = useState(() => {
    return localStorage.getItem("cobr_tour_active") === "true";
  });

  const [currentTourStep, setCurrentTourStep] = useState<number>(() => {
    const saved = localStorage.getItem("cobr_tour_step");
    const parsed = saved ? parseInt(saved, 10) : 0;
    return isNaN(parsed) ? 0 : parsed;
  });

  useEffect(() => {
    localStorage.setItem("cobr_tour_active", isTourActive.toString());
  }, [isTourActive]);

  useEffect(() => {
    localStorage.setItem("cobr_tour_step", currentTourStep.toString());
  }, [currentTourStep]);

  const startTour = () => {
    setCurrentTourStep(0);
    setIsTourActive(true);
  };

  const endTour = () => {
    setIsTourActive(false);
    localStorage.removeItem("cobr_tour_step");
    localStorage.removeItem("cobr_tour_active");
  };

  const nextStep = () => setCurrentTourStep(prev => prev + 1);
  const prevStep = () => setCurrentTourStep(prev => Math.max(0, prev - 1));

  const isCompleted = (step: OnboardingStep) => steps.includes(step);
  const totalCompleted = steps.length;
  const progress = Math.round((totalCompleted / 5) * 100);

  return {
    steps,
    isLoading,
    isCompleted,
    totalCompleted,
    progress,
    completeStep: completeStep.mutate,
    isCompleting: completeStep.isPending,
    // Tour
    isTourActive,
    currentTourStep,
    startTour,
    endTour,
    nextStep,
    prevStep,
    setCurrentTourStep,
  };
}

