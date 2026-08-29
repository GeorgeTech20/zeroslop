// Tipos puros que documentan las firmas de convex/users.ts y el union de
// áreas del schema unificado. Viven separados de convex/values para que
// otros archivos los importen sin acoplarse al validador de Convex.
//
// SkillTag es el union LEGADO de 5 que sigue esperando el frontend en
// src/lib/types.ts (Resource.skillTag) — sus componentes no se tocaron en la
// migración al schema unificado. LearningArea es el union REAL de 6 que usa
// el schema (assessments.learningAreas, learningResources.areas). Ver
// convex/resources.ts para el mapeo entre ambos.
export type SkillTag =
  | "testing"
  | "architecture"
  | "security"
  | "typescript"
  | "debugging";

export type LearningArea = SkillTag | "authentication";

// --- users.me ---
// Espejo del doc `users` en convex/schema.ts. Ya no tiene `githubUsername`
// propio (schema unificado): el puente hacia GitHub es `developerId`.
export interface User {
  _id: string;
  clerkUserId: string;
  developerId?: string;
  name?: string;
  email?: string;
  onboardingCompletedAt?: number;
}

export type MeResult = User | null;

// --- users.ensure ---
// El handler resuelve `developerId -> developers.githubUsername` para poder
// seguir devolviendo `githubUsername` tal cual lo espera
// src/lib/types.ts:EnsureResult (contrato de frontend sin tocar).
export interface EnsureUserResult {
  githubUsername?: string;
  onboardingCompletedAt?: number;
}

// --- users.linkGithubUsername ---
export interface LinkGithubUsernameInput {
  githubUsername: string;
}

// OJO: ya NO es `User` completo (antes se devolvía `ctx.db.get(me._id)`, que
// hoy no tiene `githubUsername`). El handler devuelve sólo este campo,
// igual que src/lib/types.ts:LinkGithubUsernameResult.
export interface LinkGithubUsernameResult {
  githubUsername: string | undefined;
}

// --- users.onboardingStatus ---
// Los 3 data points de activación que arman el paso a paso del onboarding.
// hasFirstEvaluation es el dato "vivo": pasa a true solo cuando llega el
// primer evaluations.save de ese developer desde el MCP, sin intervención
// del usuario en la pantalla.
export interface OnboardingStatus {
  hasAccount: boolean;
  hasGithubUsername: boolean;
  hasFirstEvaluation: boolean;
  githubUsername?: string;
}

export type OnboardingStatusResult = OnboardingStatus | null;
