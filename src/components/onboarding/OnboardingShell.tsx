"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SiteHeader } from "@/components/SiteHeader";
import { DUR_FAST, DUR_PANEL, EASE_STANDARD } from "@/lib/motion-tokens";
import { OnboardingStepper, type StepState } from "./OnboardingStepper";
import styles from "./OnboardingShell.module.css";

interface OnboardingShellProps {
  step: 1 | 2 | 3;
  direction: 1 | -1;
  nodeStates: [StepState, StepState, StepState];
  onSelectStep?: (step: 1 | 2 | 3) => void;
  children: ReactNode;
}

// Contenedor común de los 3 pasos: columna centrada (no el layout de dos
// columnas del dashboard), stepper arriba, contenido keyed por paso dentro
// de AnimatePresence (§1 y §1.2 de diseno/onboarding-y-cuenta.md).
export function OnboardingShell({
  step,
  direction,
  nodeStates,
  onSelectStep,
  children,
}: OnboardingShellProps) {
  const reduced = useReducedMotion();

  return (
    <div className={styles.page}>
      <SiteHeader />
      <div className={styles.column}>
        <OnboardingStepper current={step} states={nodeStates} onSelect={onSelectStep} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -direction * 16 }}
            transition={reduced ? { duration: DUR_FAST } : { duration: DUR_PANEL, ease: EASE_STANDARD }}
            className={styles.stepWrap}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
