"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useConvexConnectionState } from "convex/react";
import { getProfileRef, linkGithubUsernameRef, onboardingStatusRef } from "@/lib/convex-api";
import { friendlyLinkError } from "@/lib/github-username";
import { OnboardingShell } from "./OnboardingShell";
import { StepGithubUsername } from "./StepGithubUsername";
import { StepInstallSkill } from "./StepInstallSkill";
import { StepFirstEvaluation } from "./StepFirstEvaluation";
import { useOnboardingNavigation, type OnboardingStepNumber } from "./useOnboardingNavigation";
import type { StepState } from "./OnboardingStepper";

interface ConvexOnboardingFlowProps {
  initialStep: OnboardingStepNumber;
  initialGithubUsername?: string;
}

// Orquesta los 3 pasos con datos reales de Convex: useQuery(onboardingStatus)
// es la suscripción viva que hace que el paso 3 "se complete solo" cuando la
// Skill guarda la evaluación desde la terminal — nadie aprieta un botón.
export function ConvexOnboardingFlow({ initialStep, initialGithubUsername }: ConvexOnboardingFlowProps) {
  const router = useRouter();
  const { step, direction, goTo } = useOnboardingNavigation(initialStep);
  const status = useQuery(onboardingStatusRef, {});
  const connection = useConvexConnectionState();
  const linkGithubUsername = useMutation(linkGithubUsernameRef);

  const githubUsername = status?.githubUsername ?? initialGithubUsername ?? "";
  const hasFirstEvaluation = status?.hasFirstEvaluation ?? false;

  // El mini-readout de la llegada necesita el score real: onboardingStatus
  // sólo trae booleans, así que se pide developers.getProfile recién cuando
  // hay evaluación (nunca antes — "skip" evita una query innecesaria).
  const profile = useQuery(
    getProfileRef,
    hasFirstEvaluation && githubUsername ? { githubUsername } : "skip"
  );
  const scorePreview =
    hasFirstEvaluation && profile?.latestEvaluation
      ? {
          overallScore: profile.metrics.overallScore,
          comprensionDecisiones: profile.metrics.comprensionDecisiones,
          deteccionRiesgos: profile.metrics.deteccionRiesgos,
        }
      : null;

  const nodeStates: [StepState, StepState, StepState] = [
    githubUsername ? "completed" : step === 1 ? "current" : "pending",
    step > 2 || hasFirstEvaluation ? "completed" : step === 2 ? "current" : "pending",
    hasFirstEvaluation ? "completed" : step === 3 ? "current" : "pending",
  ];

  async function handleLink(username: string) {
    try {
      await linkGithubUsername({ githubUsername: username });
      goTo(2);
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: friendlyLinkError(error) };
    }
  }

  function handleSelectStep(target: OnboardingStepNumber) {
    if (target === 1 && githubUsername) goTo(1);
    if (target === 2 && (step > 2 || hasFirstEvaluation)) goTo(2);
  }

  function goToPanel() {
    router.push(`/developers/${githubUsername}`);
  }

  return (
    <OnboardingShell step={step} direction={direction} nodeStates={nodeStates} onSelectStep={handleSelectStep}>
      {step === 1 && <StepGithubUsername initialValue={githubUsername} onSubmit={handleLink} />}
      {step === 2 && <StepInstallSkill onContinue={() => goTo(3)} />}
      {step === 3 && (
        <StepFirstEvaluation
          githubUsername={githubUsername}
          hasFirstEvaluation={hasFirstEvaluation}
          reconnecting={connection.hasEverConnected && !connection.isWebSocketConnected}
          scorePreview={scorePreview}
          onArrived={goToPanel}
          onSkip={goToPanel}
        />
      )}
    </OnboardingShell>
  );
}
