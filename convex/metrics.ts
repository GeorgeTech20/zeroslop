// Helpers de agregación puros, compartidos por developers.ts y resources.ts.
// Misma lógica que mock-data.ts (computeMetrics/inferSkillTags) — ver
// ZeroSlop Backend - Mock Data Fase 1 en la memoria de la oficina: overallScore
// SIEMPRE promedia comprensionDecisiones y deteccionRiesgos, nunca calidadExplicacion.

import type { Doc } from "./_generated/dataModel";
import type { SkillTag } from "./types";

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computeMetrics(evaluations: Doc<"evaluations">[]) {
  const comprensionDecisiones = average(
    evaluations.map((e) => e.conceptualScore)
  );
  const deteccionRiesgos = average(evaluations.map((e) => e.mutationScore));
  const calidadExplicacion = average(
    evaluations.map((e) => e.explanationQuality)
  );
  const overallScore = average([comprensionDecisiones, deteccionRiesgos]);
  return { comprensionDecisiones, deteccionRiesgos, calidadExplicacion, overallScore };
}

export function latestEvaluation(
  evaluations: Doc<"evaluations">[]
): Doc<"evaluations"> | null {
  return [...evaluations].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

// Umbral por debajo del cual un score "arrastra" su skillTag hacia recomendaciones.
const LOW_SCORE_THRESHOLD = 6;

// Mapeo heurístico pregunta→skillTag, hasta tener clasificación real por LLM.
export function inferSkillTags(evaluation: Doc<"evaluations">): SkillTag[] {
  const tags: SkillTag[] = [];
  if (evaluation.mutationScore < LOW_SCORE_THRESHOLD) {
    tags.push("security", "debugging");
  }
  if (evaluation.conceptualScore < LOW_SCORE_THRESHOLD) {
    tags.push("architecture", "testing");
  }
  return tags;
}
