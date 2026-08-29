import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "ZeroSlop — Iniciar sesión",
};

// Destino único post sign-in: /dashboard, que resuelve a quién pertenece la
// sesión y redirige a SU panel. No se puede decidir acá porque todavía no
// sabemos quién inició sesión.
export default function SignInPage() {
  return (
    <AuthShell eyebrow="Bienvenido de vuelta">
      <SignIn path="/sign-in" fallbackRedirectUrl="/dashboard" />
    </AuthShell>
  );
}
