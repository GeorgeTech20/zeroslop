"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScoreReadout } from "@/components/ScoreReadout";
import { DUR_ARRIVE, DUR_FAST, EASE_STANDARD } from "@/lib/motion-tokens";
import { OnboardingCard } from "./OnboardingCard";
import btn from "./onboarding-buttons.module.css";
import styles from "./StepFirstEvaluation.module.css";

export interface ScorePreview {
  overallScore: number;
  comprensionDecisiones: number;
  deteccionRiesgos: number;
}

interface StepFirstEvaluationProps {
  githubUsername: string;
  hasFirstEvaluation: boolean;
  reconnecting: boolean;
  scorePreview: ScorePreview | null;
  onArrived: () => void;
  onSkip: () => void;
}

type Phase = "waiting" | "engaged" | "arrived";

// Paso 3 — 2º momento hero. No hay CTA de avance: el paso se completa solo
// cuando la Skill guarda una evaluación real y la suscripción de Convex la
// empuja acá (§4 de diseno/onboarding-y-cuenta.md). En modo mocks
// (hasFirstEvaluation siempre false) queda en "esperando" para siempre sin
// romperse — el escape hatch es el único camino hacia adelante.
export function StepFirstEvaluation({
  githubUsername,
  hasFirstEvaluation,
  reconnecting,
  scorePreview,
  onArrived,
  onSkip,
}: StepFirstEvaluationProps) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("waiting");
  const ready = hasFirstEvaluation && scorePreview !== null;

  useEffect(() => {
    if (ready && phase === "waiting") setPhase("engaged");
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== "engaged") return;
    const revealDelayMs = reduced ? 0 : 160;
    const handOffDelayMs = reduced ? DUR_FAST * 1000 : revealDelayMs + DUR_ARRIVE * 1000;
    const revealTimer = setTimeout(() => setPhase("arrived"), revealDelayMs);
    const handOffTimer = setTimeout(() => onArrived(), handOffDelayMs);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(handOffTimer);
    };
  }, [phase, reduced, onArrived]);

  const waitingText = reconnecting
    ? "Reconectando…"
    : `Esperando la primera evaluación de ${githubUsername}`;

  return (
    <OnboardingCard
      eyebrow="Paso 3 · corré tu primera evaluación"
      title="Andá a tu repo y abrí una PR (o corré la Skill)."
      subtitle="Cuando termines, esta pantalla se actualiza sola."
    >
      <AnimatePresence mode="wait" initial={false}>
        {phase !== "arrived" ? (
          <motion.div
            key="waiting"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR_FAST, ease: EASE_STANDARD }}
            className={styles.waitWrap}
          >
            <div
              className={styles.pulseFrame}
              data-state={reconnecting ? "reconnecting" : phase === "engaged" ? "arriving" : "listening"}
            >
              <span className={styles.pulseDot} />
              {!reduced && phase === "engaged" && (
                <motion.span
                  className={styles.scan}
                  initial={{ top: "0%", opacity: 0 }}
                  animate={{ top: ["0%", "0%", "100%", "100%"], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.4, times: [0, 0.05, 0.8, 1] }}
                />
              )}
            </div>
            <p className={styles.waitingLabel} role="status" aria-live="polite">
              {waitingText}
            </p>

            <p className={styles.checklistCaption}>Mientras tanto:</p>
            <ul className={styles.checklist}>
              <li className={styles.checklistItem} data-done="true">
                <CheckGlyph /> <span>Vinculaste tu usuario (@{githubUsername})</span>
              </li>
              <li className={styles.checklistItem} data-done="true">
                <CheckGlyph /> <span>Instalaste la Skill</span>
              </li>
              <li className={styles.checklistItem} data-done="false">
                <span className={styles.checklistPulse} aria-hidden="true" /> <span>Primera evaluación</span>
              </li>
            </ul>

            <button type="button" className={btn.escapeHatch} onClick={onSkip}>
              Saltar y ver el panel vacío
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="arrived"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduced ? { duration: DUR_FAST } : { duration: DUR_ARRIVE, ease: EASE_STANDARD }}
            className={styles.arriveWrap}
          >
            <p className={styles.arrivedLabel} role="status" aria-live="polite">
              Llegó tu primera evaluación. Abriendo tu panel…
            </p>
            {scorePreview && (
              <div className={styles.mini}>
                <ScoreReadout
                  overallScore={scorePreview.overallScore}
                  comprensionDecisiones={scorePreview.comprensionDecisiones}
                  deteccionRiesgos={scorePreview.deteccionRiesgos}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingCard>
  );
}

function CheckGlyph() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M1 5L4.2 8.2L11 1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
