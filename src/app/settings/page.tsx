import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "ZeroSlop — Configuración",
};

// Stub protegido por proxy.ts. frontend-dashboard arma las 3 secciones de
// diseno/onboarding-y-cuenta.md §5 (usuario de GitHub, cuenta, link al
// panel); acá sólo se deja montado el <UserProfile/> de Clerk con nuestro
// appearance (ClerkProvider en layout.tsx ya lo aplica global) para que la
// sección "2 · CUENTA" tenga contenido real desde ya.
export default function SettingsPage() {
  return (
    <AuthShell eyebrow="Configuración">
      <UserProfile routing="hash" />
    </AuthShell>
  );
}
