// SkillTag como tipo TS puro, espejo del union literal de schema.ts.
// Vive separado para que metrics.ts y resources.ts lo importen sin
// depender de convex/values.

export type SkillTag =
  | "testing"
  | "architecture"
  | "security"
  | "typescript"
  | "debugging";

// Espejo de las firmas de convex/users.ts (Fase 4). frontend-dashboard /
// auth-clerk mirroran esto en src/lib/types.ts como ya hicieron con
// GetProfileResult/ListTeamTableResult en Fase 2 — este archivo no lo
// importa el bundle de src/ hoy.

// --- users.me ---
export interface User {
  _id: string;
  clerkUserId: string;
  githubUsername?: string;
  name?: string;
  email?: string;
  createdAt: number;
  onboardingCompletedAt?: number;
}

export type MeResult = User | null;

// --- users.ensure ---
export interface EnsureUserResult {
  githubUsername?: string;
  onboardingCompletedAt?: number;
}

// --- users.linkGithubUsername ---
export interface LinkGithubUsernameInput {
  githubUsername: string;
}

export type LinkGithubUsernameResult = User;

// --- users.onboardingStatus ---
// Los 3 data points de activación que arman el paso a paso del onboarding.
// hasFirstEvaluation es el dato "vivo": pasa a true solo cuando llega la
// primera evaluations.save de ese githubUsername desde la terminal, sin
// intervención del usuario en la pantalla.
export interface OnboardingStatus {
  hasAccount: boolean;
  hasGithubUsername: boolean;
  hasFirstEvaluation: boolean;
  githubUsername?: string;
}

export type OnboardingStatusResult = OnboardingStatus | null;
