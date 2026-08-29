import styles from "./OnboardingStepper.module.css";

export type StepState = "completed" | "current" | "pending";

interface OnboardingStepperProps {
  current: 1 | 2 | 3;
  states: [StepState, StepState, StepState];
  onSelect?: (step: 1 | 2 | 3) => void;
}

const STEP_LABELS = ["Vinculaste tu usuario", "Instalaste la Skill", "Primera evaluación"];

// Los 3 nodos SON el medidor de activación (§1.1): vinculó GitHub → instaló
// la Skill → corrió su primera evaluación. Estado por forma + relleno, no
// por matiz — mismo principio que el readout del dashboard.
export function OnboardingStepper({ current, states, onSelect }: OnboardingStepperProps) {
  return (
    <ol className={styles.list} aria-label="Progreso del onboarding">
      {states.map((state, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3;
        const selectable = state === "completed" && onSelect && stepNumber !== current;
        const label = `Paso ${stepNumber}: ${STEP_LABELS[index]} — ${
          state === "completed" ? "completado" : state === "current" ? "actual" : "pendiente"
        }`;

        return (
          <li key={stepNumber} className={styles.item}>
            {selectable ? (
              <button
                type="button"
                className={styles.dot}
                data-state={state}
                onClick={() => onSelect?.(stepNumber)}
                aria-current={stepNumber === current ? "step" : undefined}
              >
                {state === "completed" ? <CheckGlyph /> : null}
                <span className="sr-only">{label}</span>
              </button>
            ) : (
              <span
                className={styles.dot}
                data-state={state}
                aria-current={stepNumber === current ? "step" : undefined}
              >
                {state === "completed" ? <CheckGlyph /> : null}
                <span className="sr-only">{label}</span>
              </span>
            )}
            {index < states.length - 1 && (
              <span className={styles.connector} data-filled={state === "completed"} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CheckGlyph() {
  return (
    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
      <path
        d="M1 4.5L4 7.5L10 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
