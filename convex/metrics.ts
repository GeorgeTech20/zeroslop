// Helpers de agregación puros, compartidos por developers.ts y resources.ts.
// Misma semántica que antes de la migración (ver memoria de la oficina,
// "ZeroSlop Backend - Mock Data Fase 1"): overallScore SIEMPRE promedia
// comprensionDecisiones y deteccionRiesgos, nunca calidadExplicacion. Lo que
// cambió es la fuente: ahora lee `assessments.scores.*` (schema unificado)
// en vez de `evaluations.conceptualScore/mutationScore`.

import type { Doc } from "./_generated/dataModel";

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computeMetrics(assessments: Doc<"assessments">[]) {
  const comprensionDecisiones = average(
    assessments.map((a) => a.scores.decisionUnderstanding)
  );
  const deteccionRiesgos = average(assessments.map((a) => a.scores.riskDetection));
  const calidadExplicacion = average(
    assessments.map((a) => a.scores.explanationQuality)
  );
  const overallScore = average([comprensionDecisiones, deteccionRiesgos]);
  return { comprensionDecisiones, deteccionRiesgos, calidadExplicacion, overallScore };
}

// Sin createdAt propio (schema unificado): se ordena por _creationTime.
export function latestAssessment(
  assessments: Doc<"assessments">[]
): Doc<"assessments"> | null {
  return [...assessments].sort((a, b) => b._creationTime - a._creationTime)[0] ?? null;
}
