import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import styles from "./AuthShell.module.css";

// Layout compartido de /sign-in, /sign-up y los stubs de /onboarding y
// /settings: columna centrada min(560px), mismo header arriba, fondo
// --color-bg — ver diseno/onboarding-y-cuenta.md §1 y §6.5. Las pantallas
// finales (stepper de onboarding, secciones de settings) las construye
// frontend-dashboard; esto es solo el marco que ya usan las páginas reales
// de Clerk.
export function AuthShell({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.column}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        {children}
      </div>
    </div>
  );
}
