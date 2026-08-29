"use client";

import { useCallback, useState } from "react";

export type OnboardingStepNumber = 1 | 2 | 3;

// Estado de "en qué paso estoy" + dirección (para que OnboardingShell sepa
// si la transición de Motion es "hacia adelante" o "hacia atrás", §1.2 de
// diseno/onboarding-y-cuenta.md). Es lo único que ConvexOnboardingFlow y
// MockOnboardingFlow comparten tal cual — el resto (vincular usuario,
// suscripción a Convex) difiere entre los dos modos.
export function useOnboardingNavigation(initialStep: OnboardingStepNumber) {
  const [step, setStep] = useState<OnboardingStepNumber>(initialStep);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goTo = useCallback(
    (next: OnboardingStepNumber) => {
      setDirection(next >= step ? 1 : -1);
      setStep(next);
    },
    [step]
  );

  return { step, direction, goTo };
}
