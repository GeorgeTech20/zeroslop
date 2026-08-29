import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexOnboardingFlow } from "@/components/onboarding/ConvexOnboardingFlow";
import { MockOnboardingFlow } from "@/components/onboarding/MockOnboardingFlow";
import { onboardingStatusRef, usersEnsureRef } from "@/lib/convex-api";
import type { OnboardingStepNumber } from "@/components/onboarding/useOnboardingNavigation";

export const metadata: Metadata = {
  title: "ZeroSlop — Onboarding",
};

// Gate + arranque de los 3 pasos reales de diseno/onboarding-y-cuenta.md.
//
// Sin NEXT_PUBLIC_CONVEX_URL (ver backend/CONVEX-SETUP.md) no hay deployment
// al que preguntarle nada: se monta MockOnboardingFlow directo, mismo
// criterio que src/lib/data-source.ts para /developers/[githubUsername].
//
// Con Convex: `users.ensure` primero (para que la fila exista antes de que
// el paso 1 intente vincular nada) y después el estado real decide dónde
// arranca la persona — vincular el usuario de GitHub es sólo el paso 1 de
// 3, así que el gate de "ya terminado, andate al panel" es
// hasFirstEvaluation, NO hasGithubUsername (si sólo vinculó el usuario
// todavía le faltan los pasos 2 y 3).
export default async function OnboardingPage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <MockOnboardingFlow />;
  }

  const { getToken } = await auth();
  const token = (await getToken({ template: "convex" })) ?? undefined;

  await fetchMutation(usersEnsureRef, {}, { token });
  const status = await fetchQuery(onboardingStatusRef, {}, { token });

  if (status?.hasFirstEvaluation && status.githubUsername) {
    redirect(`/developers/${status.githubUsername}`);
  }

  const initialStep: OnboardingStepNumber = status?.hasGithubUsername ? 2 : 1;

  return (
    <ConvexOnboardingFlow initialStep={initialStep} initialGithubUsername={status?.githubUsername} />
  );
}
