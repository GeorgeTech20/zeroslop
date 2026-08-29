import styles from "./MutationPatch.module.css";

interface MutationPatchProps {
  description: string;
}

function splitMutation(description: string): { prose: string; diff: string | null } {
  const fenceStart = description.indexOf("```diff");
  if (fenceStart === -1) return { prose: description.trim(), diff: null };
  const prose = description.slice(0, fenceStart).trim();
  const contentStart = description.indexOf("\n", fenceStart) + 1;
  const fenceEnd = description.indexOf("```", contentStart);
  const diff = description
    .slice(contentStart, fenceEnd === -1 ? undefined : fenceEnd)
    .replace(/\n$/, "");
  return { prose, diff };
}

// Sin coloreado semáforo por línea +/- : el prefijo del diff ya carga el
// significado, no hace falta duplicarlo con rojo/verde.
export function MutationPatch({ description }: MutationPatchProps) {
  const { prose, diff } = splitMutation(description);

  return (
    <div className={styles.wrap}>
      {prose && <p className={styles.prose}>{prose}</p>}
      {diff && (
        <pre className={styles.pre}>
          <code>
            {diff.split("\n").map((line, index) => (
              <span
                key={index}
                className={
                  line.startsWith("+")
                    ? styles.lineAdded
                    : line.startsWith("-")
                      ? styles.lineRemoved
                      : styles.line
                }
              >
                {line}
                {"\n"}
              </span>
            ))}
          </code>
        </pre>
      )}
    </div>
  );
}
