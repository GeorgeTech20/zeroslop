"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DUR_FAST } from "@/lib/motion-tokens";
import { sanitizeGithubUsernameInput } from "@/lib/github-username";
import { OnboardingCard } from "./OnboardingCard";
import btn from "./onboarding-buttons.module.css";
import styles from "./StepGithubUsername.module.css";

type SubmitResult = { ok: true } | { ok: false; message: string };

interface StepGithubUsernameProps {
  initialValue: string;
  onSubmit: (githubUsername: string) => Promise<SubmitResult>;
}

// Paso 1 — el único dato de todo el onboarding. La llave que une lo que
// pasa en la terminal con el panel (§2 de diseno/onboarding-y-cuenta.md).
export function StepGithubUsername({ initialValue, onSubmit }: StepGithubUsernameProps) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(raw: string) {
    setError(null);
    setValue(sanitizeGithubUsernameInput(raw));
  }

  async function handleConfirm() {
    if (submitting) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Necesitamos tu usuario para armar tu panel.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(trimmed);
    setSubmitting(false);
    if (!result.ok) setError(result.message);
  }

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    void handleConfirm();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleConfirm();
    }
  }

  return (
    <OnboardingCard
      eyebrow="Paso 1 · tu usuario de GitHub"
      title="Con esto te encontramos."
      subtitle="Es lo único que te vamos a pedir."
      footer={
        <>
          <span className={btn.stepLabel}>Paso 1 de 3</span>
          <button
            type="button"
            className={btn.primaryBtn}
            onClick={handleConfirm}
            disabled={submitting || value.trim() === ""}
          >
            {submitting ? "Vinculando…" : "Continuar →"}
          </button>
        </>
      }
    >
      <form onSubmit={handleFormSubmit} noValidate>
        <label className={styles.fieldLabel} htmlFor="github-username-input">
          Usuario de GitHub
        </label>
        <div className={styles.inputWrap} data-error={error ? "true" : "false"}>
          <span className={styles.prefix}>github.com/</span>
          <input
            id="github-username-input"
            className={styles.input}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="octocat"
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={39}
            aria-describedby={error ? "github-username-error" : "github-username-chip"}
          />
        </div>
        {error && (
          <p id="github-username-error" className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.chipRow}>
          <p className={styles.chipCaption}>Tu panel va a vivir en:</p>
          <div className={styles.chip} data-state={value ? "active" : "empty"} id="github-username-chip">
            <span className={styles.chipMuted}>zeroslop.app/developers/</span>
            {value ? (
              <span className={styles.chipUser}>
                {reduced ? (
                  value
                ) : (
                  <AnimatePresence initial={false}>
                    {value.split("").map((char, index) => (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, filter: "blur(4px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        transition={{ duration: DUR_FAST, delay: index * 0.018 }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                )}
              </span>
            ) : (
              <span className={styles.chipPlaceholder}>tu-usuario</span>
            )}
            <span
              className={styles.chipArrow}
              aria-hidden="true"
              title="Va a estar disponible cuando corras tu primera evaluación"
            >
              ↗
            </span>
          </div>
        </div>
      </form>
    </OnboardingCard>
  );
}
