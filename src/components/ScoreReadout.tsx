"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { DUR_READOUT, EASE_READOUT, EASE_STANDARD } from "@/lib/motion-tokens";
import styles from "./ScoreReadout.module.css";

interface ScoreReadoutProps {
  overallScore: number;
  comprensionDecisiones: number;
  deteccionRiesgos: number;
}

const CX = 90;
const CY = 90;
const R = 76;
const START_ANGLE = -125;
const END_ANGLE = 125;

function polarToCartesian(angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + R * Math.cos(angleRad), y: CY + R * Math.sin(angleRad) };
}

// El punto `M` es s=0 del recorrido del path — con stroke-dashoffset el
// relleno crece desde ahí, por eso el arco arranca en startAngle (no al
// revés) y barre en sentido horario (sweep-flag=1) hasta endAngle.
function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const ARC_PATH = describeArc(START_ANGLE, END_ANGLE);

export function ScoreReadout({
  overallScore,
  comprensionDecisiones,
  deteccionRiesgos,
}: ScoreReadoutProps) {
  const reduced = useReducedMotion();
  const scoreMV = useMotionValue(0);
  const dashOffset = useTransform(scoreMV, (v) => 100 - (v / 10) * 100);
  const [digit, setDigit] = useState("0.0");

  useEffect(() => {
    const unsub = scoreMV.on("change", (v) => setDigit(v.toFixed(1)));
    return unsub;
  }, [scoreMV]);

  useEffect(() => {
    if (reduced) {
      scoreMV.set(overallScore);
      return;
    }
    const controls = animate(scoreMV, overallScore, {
      duration: DUR_READOUT,
      ease: EASE_READOUT,
    });
    return () => controls.stop();
  }, [overallScore, reduced, scoreMV]);

  const comprensionPct = Math.max(0, Math.min(100, (comprensionDecisiones / 10) * 100));
  const riesgosPct = Math.max(0, Math.min(100, (deteccionRiesgos / 10) * 100));

  return (
    <motion.div
      className={styles.well}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced ? { duration: 0.12 } : { duration: 0.22, ease: EASE_STANDARD }
      }
    >
      <div className={styles.arcWrap}>
        <svg viewBox="0 0 180 180" className={styles.arcSvg} aria-hidden="true">
          <path
            d={ARC_PATH}
            className={styles.arcTrack}
            pathLength={100}
          />
          <motion.path
            d={ARC_PATH}
            className={styles.arcFill}
            pathLength={100}
            strokeDasharray={100}
            style={{ strokeDashoffset: reduced ? 100 - (overallScore / 10) * 100 : dashOffset }}
          />
        </svg>
        <div className={styles.digitWrap}>
          <span className={`${styles.digit} tabular-nums`}>{digit}</span>
          <span className={styles.digitSuffix}>/ 10</span>
        </div>
      </div>
      <span className={styles.readoutLabel}>overallScore</span>

      {!reduced && (
        <motion.div
          className={styles.scanline}
          initial={{ top: "0%", opacity: 0 }}
          animate={{ top: ["0%", "0%", "100%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, delay: 0.5, times: [0, 0.05, 0.75, 1] }}
        />
      )}

      <div className={styles.meters}>
        <WellMeter
          label="comprensión"
          tone="iris"
          value={comprensionDecisiones}
          pct={comprensionPct}
          delay={reduced ? 0 : 0.56}
          reduced={!!reduced}
        />
        <WellMeter
          label="riesgos"
          tone="voltio"
          value={deteccionRiesgos}
          pct={riesgosPct}
          delay={reduced ? 0 : 0.62}
          reduced={!!reduced}
        />
      </div>
    </motion.div>
  );
}

interface WellMeterProps {
  label: string;
  tone: "iris" | "voltio";
  value: number;
  pct: number;
  delay: number;
  reduced: boolean;
}

function WellMeter({ label, tone, value, pct, delay, reduced }: WellMeterProps) {
  return (
    <div className={styles.meterRow}>
      <span className={styles.meterLabel}>{label}</span>
      <div className={styles.meterTrack}>
        <motion.div
          className={styles.meterFill}
          data-tone={tone}
          initial={{ width: reduced ? `${pct}%` : "0%" }}
          animate={{ width: `${pct}%` }}
          transition={
            reduced
              ? { duration: 0.12 }
              : { duration: 0.34, delay, ease: EASE_STANDARD }
          }
        />
      </div>
      <span className={`${styles.meterValue} tabular-nums`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}
