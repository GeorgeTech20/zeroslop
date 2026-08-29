import { Meter } from "@base-ui/react/meter";
import styles from "./MetricMeter.module.css";

type Tone = "iris" | "voltio" | "neutral";

interface MetricMeterProps {
  value: number;
  max?: number;
  tone: Tone;
  label?: string;
  compact?: boolean;
}

// Score codificado por RELLENO (ancho de la barra), nunca por matiz — el
// mismo color de tono se usa sin importar si el valor es alto o bajo.
export function MetricMeter({
  value,
  max = 10,
  tone,
  label,
  compact,
}: MetricMeterProps) {
  return (
    <Meter.Root
      value={value}
      min={0}
      max={max}
      className={styles.root}
      aria-label={label}
      format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
    >
      {label && <Meter.Label className={styles.label}>{label}</Meter.Label>}
      <div className={styles.row}>
        <Meter.Track
          data-tone={tone}
          className={compact ? `${styles.track} ${styles.trackCompact}` : styles.track}
        >
          <Meter.Indicator data-tone={tone} className={styles.indicator} />
        </Meter.Track>
        <Meter.Value className={`${styles.value} tabular-nums`}>
          {(formatted) => formatted}
        </Meter.Value>
      </div>
    </Meter.Root>
  );
}
