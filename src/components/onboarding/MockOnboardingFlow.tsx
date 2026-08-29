"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { friendlyLinkError, mockLinkGithubUsername } from "@/lib/github-username";
import { OnboardingShell } from "./OnboardingShell";
import { StepGithubUsername } from "./StepGithubUsername";
import { StepInstallSkill } from "./StepInstallSkill";
import { StepFirstEvaluation } from "./StepFirstEvaluation";
import { useOnboardingNavigation } from "./useOnboardingNavigation";
import type { StepState } from "./OnboardingStepper";

const FALLBACK_DEMO_USERNAME = "mariafernandez";

// Sin NEXT_PUBLIC_CONVEX_URL (ver src/lib/data-source.ts, mismo criterio):
// no hay sesión de Convex a la que suscribirse, así que el paso 1 simula la
// mutación localmente (misma regex y mismos dos errores que
// convex/users.ts) y el paso 3 se queda "esperando" para siempre — no se
// inventa una llegada falsa, el camino real queda escrito y andando en
// cuanto exista deployment (ver ConvexOnboardingFlow).
export function MockOnboardingFlow() {
  const router = useRouter();
  const { step, direction, goTo } = useOnboardingNavigation(1);
  const [githubUsername, setGithubUsername] = useState("");

  const nodeStates: [StepState, StepState, StepState] = [
    githubUsername ? "completed" : step === 1 ? "current" : "pending",
    step > 2 ? "completed" : step === 2 ? "current" : "pending",
    step === 3 ? "current" : "pending",
  ];

  async function handleLink(username: string) {
    try {
      const result = await mockLinkGithubUsername(username);
      setGithubUsername(result.githubUsername);
      goTo(2);
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: friendlyLinkError(error) };
    }
  }

  function handleSelectStep(target: 1 | 2 | 3) {
    if (target === 1 && githubUsername) goTo(1);
    if (target === 2 && step > 2) goTo(2);
  }

  function goToPanel() {
    router.push(`/developers/${githubUsername || FALLBACK_DEMO_USERNAME}`);
  }

  return (
    <OnboardingShell step={step} direction={direction} nodeStates={nodeStates} onSelectStep={handleSelectStep}>
      {step === 1 && <StepGithubUsername initialValue={githubUsername} onSubmit={handleLink} />}
      {step === 2 && <StepInstallSkill onContinue={() => goTo(3)} />}
      {step === 3 && (
        <StepFirstEvaluation
          githubUsername={githubUsername || "tu-usuario"}
          hasFirstEvaluation={false}
          reconnecting={false}
          scorePreview={null}
          onArrived={goToPanel}
          onSkip={goToPanel}
        />
      )}
    </OnboardingShell>
  );
}
