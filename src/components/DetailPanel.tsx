"use client";

import { Tabs } from "@base-ui/react/tabs";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { GetProfileResult } from "@/lib/types";
import { ScoreReadout } from "./ScoreReadout";
import { MutationPatch } from "./MutationPatch";
import { ResourceList } from "./ResourceList";
import { EASE_STANDARD } from "@/lib/motion-tokens";
import styles from "./DetailPanel.module.css";

interface DetailPanelProps {
  profile: GetProfileResult | null;
  selectedUsername: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function DetailPanel({ profile, selectedUsername }: DetailPanelProps) {
  const reduced = useReducedMotion();

  const variants = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
      };
  const transition = reduced
    ? { duration: 0.12 }
    : { duration: 0.22, ease: EASE_STANDARD };

  return (
    <div className={styles.panel}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedUsername}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={transition}
        >
          {profile ? (
            <ProfileContent profile={profile} />
          ) : (
            <EmptyProfile username={selectedUsername} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProfileContent({ profile }: { profile: GetProfileResult }) {
  const evaluation = profile.latestEvaluation;

  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.name}>{profile.name}</h1>
          <span className={styles.username}>@{profile.githubUsername}</span>
        </div>
        {evaluation && (
          <a
            href={evaluation.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.prLink}
          >
            Ver PR en GitHub ↗
          </a>
        )}
      </header>

      {evaluation ? (
        <>
          <ScoreReadout
            overallScore={evaluation.overallScore}
            comprensionDecisiones={evaluation.conceptualScore}
            deteccionRiesgos={evaluation.mutationScore}
          />

          <Tabs.Root defaultValue="conceptual" className={styles.tabsRoot}>
            <Tabs.List className={styles.tabsList}>
              <Tabs.Tab value="conceptual" className={styles.tab}>
                Pregunta conceptual
              </Tabs.Tab>
              <Tabs.Tab value="mutation" className={styles.tab}>
                Mutación crítica
              </Tabs.Tab>
              <Tabs.Indicator className={styles.tabsIndicator} />
            </Tabs.List>

            <Tabs.Panel value="conceptual" className={styles.tabPanel}>
              <p className={styles.question}>{evaluation.conceptualQuestion}</p>
              <p className={styles.answer}>{evaluation.conceptualAnswer}</p>
              <span className={styles.scoreTag}>
                comprensionDecisiones: {evaluation.conceptualScore.toFixed(1)}/10
              </span>
            </Tabs.Panel>

            <Tabs.Panel value="mutation" className={styles.tabPanel}>
              <MutationPatch description={evaluation.mutationDescription} />
              <p className={styles.answer}>{evaluation.mutationAnswer}</p>
              <span className={styles.scoreTag}>
                deteccionRiesgos: {evaluation.mutationScore.toFixed(1)}/10
              </span>
            </Tabs.Panel>
          </Tabs.Root>

          <section className={styles.resourcesSection}>
            <h2 className={styles.sectionTitle}>Recursos recomendados</h2>
            <ResourceList
              resources={profile.recommendedResources}
              evaluation={evaluation}
            />
          </section>

          <span className={styles.timestamp}>
            Última evaluación: {dateFormatter.format(new Date(evaluation.createdAt))}
          </span>
        </>
      ) : (
        <p className={styles.noEval}>Todavía no hay evaluaciones registradas.</p>
      )}
    </div>
  );
}

function EmptyProfile({ username }: { username: string }) {
  return (
    <div className={styles.empty}>
      <h1 className={styles.name}>@{username}</h1>
      <p className={styles.noEval}>
        Todavía no hay evaluaciones para este developer. Van a aparecer acá
        apenas corra su primer check de PR.
      </p>
    </div>
  );
}
