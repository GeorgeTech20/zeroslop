// Tipos que replican EXACTAMENTE las firmas de las futuras queries de Convex.
// El frontend importa desde acá durante la Fase 1 (data mockeada) y desde
// `convex/_generated/api` cuando el backend real exista — misma forma.
// Espejo de workspace/zeroslop/backend/types.ts (sala backend-convex).

export type SkillTag =
  | "testing"
  | "architecture"
  | "security"
  | "typescript"
  | "debugging";

export interface Resource {
  _id: string;
  title: string;
  url: string;
  skillTag: SkillTag;
}

export interface Evaluation {
  _id: string;
  githubUsername: string;
  pullRequestUrl: string;
  conceptualQuestion: string;
  conceptualAnswer: string;
  conceptualScore: number; // 0-10
  mutationDescription: string; // el patch hipotético mostrado
  mutationAnswer: string;
  mutationScore: number; // 0-10
  explanationQuality: number; // 0-10, promedio de claridad/precisión de ambas respuestas
  overallScore: number; // avg(conceptualScore, mutationScore)
  createdAt: number;
}

// --- developers.listTeamTable ---
// query, sin filtros. Nombre + promedio acumulado de las 3 métricas por persona.

export interface TeamTableRow {
  githubUsername: string;
  name: string;
  comprensionDecisiones: number; // promedio acumulado
  deteccionRiesgos: number; // promedio acumulado
  calidadExplicacion: number; // promedio acumulado
  overallScore: number; // promedio de comprensionDecisiones y deteccionRiesgos
  evaluationsCount: number;
}

export type ListTeamTableResult = TeamTableRow[];

// --- developers.getProfile ---
// query. Input { githubUsername }.

export interface GetProfileInput {
  githubUsername: string;
}

export interface DeveloperProfileMetrics {
  comprensionDecisiones: number; // promedio acumulado
  deteccionRiesgos: number; // promedio acumulado
  calidadExplicacion: number; // promedio acumulado
  overallScore: number; // promedio de comprensionDecisiones y deteccionRiesgos
}

export interface LatestEvaluation {
  pullRequestUrl: string;
  conceptualQuestion: string;
  conceptualAnswer: string;
  conceptualScore: number;
  mutationDescription: string;
  mutationAnswer: string;
  mutationScore: number;
  explanationQuality: number;
  overallScore: number;
  createdAt: number;
}

export interface GetProfileResult {
  githubUsername: string;
  name: string;
  metrics: DeveloperProfileMetrics;
  latestEvaluation: LatestEvaluation | null;
  recommendedResources: Resource[]; // hasta 3, vía resources.recommend
}

// --- resources.recommend ---
// query interna. Input: skillTags que más se repiten en respuestas de bajo score.

export interface RecommendInput {
  skillTags: SkillTag[];
}

export type RecommendResult = Resource[]; // hasta 3

// --- users.onboardingStatus (convex/users.ts) ---
// Refleja el modelo de cuenta web (Clerk), no el catálogo de developers de
// arriba. null cuando no hay sesión de Clerk (no debería pasar detrás de
// proxy.ts, que ya protege /onboarding).

export interface OnboardingStatusResult {
  hasAccount: boolean;
  hasGithubUsername: boolean;
  hasFirstEvaluation: boolean;
  githubUsername: string | undefined;
}

// --- users.ensure (convex/users.ts) ---
// mutation, sin args. Idempotente: crea la fila la primera vez, si no
// devuelve el estado ya existente.

export interface EnsureResult {
  githubUsername: string | undefined;
  onboardingCompletedAt: number | undefined;
}

// --- users.linkGithubUsername (convex/users.ts) ---
// mutation. Tira si el formato es inválido o si el usuario ya está
// vinculado a otra cuenta (ver src/lib/github-username.ts, que mapea esos
// mensajes a copy amigable). Sólo se leen los campos que usa /onboarding.

export interface LinkGithubUsernameResult {
  githubUsername: string | undefined;
}
