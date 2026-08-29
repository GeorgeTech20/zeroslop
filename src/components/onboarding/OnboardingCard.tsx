import type { ReactNode } from "react";
import styles from "./OnboardingCard.module.css";

interface OnboardingCardProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// La misma tarjeta física en los 3 pasos — lo que cambia adentro es el
// contenido, el marco es constante (§1: "una idea por vez").
export function OnboardingCard({ eyebrow, title, subtitle, children, footer }: OnboardingCardProps) {
  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
