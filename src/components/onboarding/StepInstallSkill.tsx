"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DUR_FAST, DUR_PANEL, EASE_STANDARD } from "@/lib/motion-tokens";
import { MutationPatch } from "@/components/MutationPatch";
import { OnboardingCard } from "./OnboardingCard";
import btn from "./onboarding-buttons.module.css";
import styles from "./StepInstallSkill.module.css";

interface StepInstallSkillProps {
  onContinue: () => void;
}

type Shell = "posix" | "powershell";

// El comando se arma con el origin real: en local apunta a localhost, en
// producción al dominio donde esté desplegada la app. Un dominio hardcodeado
// hace que el paso 2 falle para todo el mundo salvo en producción.
const SKILL_PATH = ".claude/skills/zeroslop-pr-check";

function installCommand(origin: string, shell: Shell) {
  const url = `${origin}/skill/zeroslop-pr-check.md`;
  if (shell === "powershell") {
    // PowerShell 5.1 no acepta '&&' como separador, y 'curl' ahí es un alias de
    // Invoke-WebRequest que no entiende -fsSL: hay que llamar a curl.exe.
    return `New-Item -ItemType Directory -Force ${SKILL_PATH.replace(/\//g, "\\")} | Out-Null; curl.exe -fsSL ${url} -o ${SKILL_PATH.replace(/\//g, "\\")}\\SKILL.md`;
  }
  return `mkdir -p ${SKILL_PATH} && curl -fsSL ${url} -o ${SKILL_PATH}/SKILL.md`;
}

// El mismo formato que ya renderiza MutationPatch: prosa + ```diff fenced.
const CHALLENGE_MUTATION = `Un cambio hipotético en tu terminal. ¿Por qué sería peligroso?

\`\`\`diff
  function total(items) {
-   return items.reduce((a, b) => a + b.price, 0)
+   return items.reduce((a, b) => a + b.price)
  }
\`\`\``;

const EXPECTED_EVIDENCE = [
  {
    axis: "riesgos" as const,
    text: "sin seed, reduce() tira TypeError con una lista vacía",
  },
  {
    axis: "comprensión" as const,
    text: "el 0 no es cosmético — es el caso base de la suma",
  },
];

const MIN_ANSWER_LENGTH = 15;

// Paso 2 — llevar la Skill al repo (el comando, arriba, es el trabajo) y
// la prueba de 30s (abajo, el gancho). No hay LLM en la web: no se puntúa,
// se revela lo que la rúbrica esperaba (§3 de diseno/onboarding-y-cuenta.md).
export function StepInstallSkill({ onContinue }: StepInstallSkillProps) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [shell, setShell] = useState<Shell>("posix");

  useEffect(() => {
    setOrigin(window.location.origin);
    // Windows arranca en PowerShell, que es donde el comando POSIX falla.
    if (/win/i.test(navigator.platform)) setShell("powershell");
  }, []);

  const command = installCommand(origin || "http://localhost:3000", shell);
  const [flashKey, setFlashKey] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      return;
    }
    setCopied(true);
    setFlashKey((key) => key + 1);
    // Vaciar antes de re-setear: si el texto no cambia entre dos copias
    // seguidas, algunos lectores de pantalla no vuelven a anunciarlo.
    setLiveMessage("");
    setTimeout(() => setLiveMessage("Comando copiado."), 30);
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(false), 1400);
  }

  function handlePreKeyDown(event: KeyboardEvent<HTMLPreElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
      event.preventDefault();
      void handleCopy();
    }
  }

  return (
    <OnboardingCard
      eyebrow="Paso 2 · instalá la Skill"
      title="Pegá esto en tu repo."
      subtitle="Se instala como una Skill de Claude Code."
      footer={
        <>
          <span className={btn.stepLabel}>Paso 2 de 3</span>
          <button
            type="button"
            className={copied ? btn.primaryBtn : btn.ghostBtn}
            onClick={onContinue}
            disabled={!copied}
            title={copied ? undefined : "Copiá el comando de arriba para continuar"}
          >
            Continuar →
          </button>
        </>
      }
    >
      <div>
        <div className={styles.shellPicker} role="group" aria-label="Shell">
          <button
            type="button"
            data-active={shell === "posix"}
            onClick={() => setShell("posix")}
          >
            bash / zsh
          </button>
          <button
            type="button"
            data-active={shell === "powershell"}
            onClick={() => setShell("powershell")}
          >
            PowerShell
          </button>
        </div>
        <pre
          key={flashKey}
          className={styles.commandBlock}
          data-flash={flashKey > 0 ? "true" : "false"}
          tabIndex={0}
          onKeyDown={handlePreKeyDown}
        >
          <code>
            <span className={styles.prompt}>{shell === "powershell" ? "PS> " : "$ "}</span>
            {command}
          </code>
          <button type="button" className={styles.copyBtn} data-copied={copied} onClick={handleCopy}>
            {copied ? <CheckGlyph /> : <ClipGlyph />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </pre>
        <p className="sr-only" role="status" aria-live="polite">
          {liveMessage}
        </p>
        <p className={styles.altNote}>
          ¿Sin Claude Code?{" "}
          <a href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer">
            Cómo instalarlo ↗
          </a>
        </p>
      </div>

      <div className={styles.challenge}>
        <div className={styles.challengeHeader}>
          <p className={styles.challengeEyebrow}>
            Probalo en 30s
            {revealed && (
              <span className={styles.doneBadge}>
                <CheckGlyph /> hecho
              </span>
            )}
          </p>
          <p className={styles.challengeSubtitle}>Esto es lo que va a pasar en tu terminal.</p>
        </div>

        {!revealed ? (
          <>
            <MutationPatch description={CHALLENGE_MUTATION} />
            <textarea
              className={styles.answerBox}
              placeholder="escribí por qué… (no se guarda, no se puntúa)"
              rows={3}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
            <div className={styles.challengeFooter}>
              <button
                type="button"
                className={btn.ghostBtn}
                disabled={answer.trim().length < MIN_ANSWER_LENGTH}
                onClick={() => setRevealed(true)}
              >
                Ver qué esperaba la rúbrica
              </button>
            </div>
          </>
        ) : (
          <motion.div
            className={styles.reveal}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: DUR_FAST } : { duration: DUR_PANEL, ease: EASE_STANDARD }}
          >
            <div className={styles.revealCard} data-tone="neutral">
              <p className={styles.revealLabel}>Tu respuesta</p>
              <p className={styles.revealText}>“{answer}”</p>
            </div>
            <div className={styles.revealCard} data-tone="signal">
              <p className={styles.revealLabel}>Lo que la rúbrica buscaba</p>
              <ul className={styles.evidenceList}>
                {EXPECTED_EVIDENCE.map((item) => (
                  <li key={item.axis} className={styles.evidenceItem}>
                    <span className={styles.axisChip} data-axis={item.axis}>
                      {item.axis === "riesgos" ? "deteccionRiesgos" : "comprensionDecisiones"}
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.revealFooter}>
              <p className={styles.revealFooterNote}>Esto es lo que ZeroSlop mide en cada PR.</p>
              <button
                type="button"
                className={btn.ghostBtn}
                onClick={onContinue}
                disabled={!copied}
                title={copied ? undefined : "Copiá el comando de arriba para continuar"}
              >
                Entendido, seguir →
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </OnboardingCard>
  );
}

function ClipGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="4" y="1.5" width="6" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 3.5H2.5A1.2 1.2 0 0 0 1.3 4.7V10.5A1.2 1.2 0 0 0 2.5 11.7H8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
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
