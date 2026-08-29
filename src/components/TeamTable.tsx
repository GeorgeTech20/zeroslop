"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import type { ListTeamTableResult } from "@/lib/types";
import { MetricMeter } from "./MetricMeter";
import styles from "./TeamTable.module.css";

const EASE_STANDARD: [number, number, number, number] = [0.32, 0.72, 0, 1];

interface TeamTableProps {
  rows: ListTeamTableResult;
  selectedUsername: string;
}

export function TeamTable({ rows, selectedUsername }: TeamTableProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const selectedIndex = rows.findIndex(
    (row) => row.githubUsername === selectedUsername
  );
  const [focusedIndex, setFocusedIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  function select(username: string) {
    router.push(`/developers/${username}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(rows.length - 1, index + 1);
      setFocusedIndex(next);
      rowRefs.current[next]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = Math.max(0, index - 1);
      setFocusedIndex(prev);
      rowRefs.current[prev]?.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(rows[index].githubUsername);
    }
  }

  return (
    <div className={styles.wrap}>
      <div role="grid" aria-label="Equipo" className={styles.grid}>
        <div role="row" className={styles.headerRow}>
          <span role="columnheader" className={styles.headCell}>
            Developer
          </span>
          <span role="columnheader" className={styles.headCellMetric}>
            Comprensión
          </span>
          <span role="columnheader" className={styles.headCellMetric}>
            Riesgos
          </span>
          <span role="columnheader" className={styles.headCellMetric}>
            Explicación
          </span>
        </div>
        <div role="rowgroup">
          {rows.map((row, index) => {
            const active = row.githubUsername === selectedUsername;
            return (
              <div
                key={row.githubUsername}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                role="row"
                aria-selected={active}
                tabIndex={index === focusedIndex ? 0 : -1}
                className={`${styles.row} ${active ? styles.rowActive : ""}`}
                onClick={() => select(row.githubUsername)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onFocus={() => setFocusedIndex(index)}
              >
                {active && (
                  <motion.span
                    layoutId="active-row-indicator"
                    className={styles.indicator}
                    transition={
                      reduced
                        ? { duration: 0.12 }
                        : { duration: 0.26, ease: EASE_STANDARD }
                    }
                  />
                )}
                <span role="gridcell" className={styles.cell}>
                  <span className={styles.name}>{row.name}</span>
                  <span className={styles.username}>
                    @{row.githubUsername}
                  </span>
                </span>
                <span role="gridcell" className={styles.cellMetric}>
                  <MetricMeter
                    value={row.comprensionDecisiones}
                    tone="iris"
                    compact
                  />
                </span>
                <span role="gridcell" className={styles.cellMetric}>
                  <MetricMeter
                    value={row.deteccionRiesgos}
                    tone="voltio"
                    compact
                  />
                </span>
                <span role="gridcell" className={styles.cellMetric}>
                  <MetricMeter
                    value={row.calidadExplicacion}
                    tone="neutral"
                    compact
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
