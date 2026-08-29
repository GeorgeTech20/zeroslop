import type { LatestEvaluation, Resource } from "./types";

// Explica por qué se recomienda un recurso en función del error puntual del
// developer en su evaluación más reciente, no de una descripción genérica
// del skillTag. `resources.recommend` ya eligió el recurso por tag; acá sólo
// se redacta el motivo con los números reales de esa evaluación.

function truncate(text: string, max: number): string {
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > max ? `${firstLine.slice(0, max).trim()}…` : firstLine;
}

export function explainRecommendation(
  resource: Resource,
  evaluation: LatestEvaluation
): string {
  const mutationTopic = truncate(evaluation.mutationDescription, 70);
  const conceptualTopic = truncate(evaluation.conceptualQuestion, 70);

  switch (resource.skillTag) {
    case "security":
      return `Detección de riesgos: ${evaluation.mutationScore}/10 en "${mutationTopic}" — este recurso ataca directo el punto ciego de seguridad que mostró esa mutación.`;
    case "debugging":
      return `Detección de riesgos: ${evaluation.mutationScore}/10 en "${mutationTopic}" — reforzar cómo razonar el impacto de un cambio antes de asumir que no rompe nada.`;
    case "architecture":
      return `Comprensión de decisiones: ${evaluation.conceptualScore}/10 en "${conceptualTopic}" — conecta con el tradeoff de diseño que la respuesta no terminó de justificar.`;
    case "testing":
      return `Comprensión de decisiones: ${evaluation.conceptualScore}/10 en "${conceptualTopic}" — ayuda a argumentar con más rigor por qué una estrategia de test es la correcta.`;
    case "typescript":
      return `Basado en el patrón de errores de esta evaluación — tipar mejor las fronteras del código reduce el tipo de duda que aparece en estas respuestas.`;
    default:
      return "Recomendado en base a los errores puntuales de la evaluación más reciente.";
  }
}
