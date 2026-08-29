import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "ZeroSlop — Iniciar sesión",
};

// Destino único post sign-in: /onboarding. Esa página decide si hay que
// seguir de largo a /developers/{usuario} (ya onboardeado) o mostrar el
// stepper (ver src/app/onboarding/page.tsx) — no se puede decidir acá
// porque todavía no sabemos quién inició sesión.
export default function SignInPage() {
  return (
    <AuthShell eyebrow="Bienvenido de vuelta">
      <SignIn path="/sign-in" fallbackRedirectUrl="/onboarding" />
    </AuthShell>
  );
}
