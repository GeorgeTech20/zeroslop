import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "ZeroSlop — Registrarse",
};

export default function SignUpPage() {
  return (
    <AuthShell eyebrow="Empezá a demostrar comprensión">
      <SignUp path="/sign-up" fallbackRedirectUrl="/onboarding" />
    </AuthShell>
  );
}
