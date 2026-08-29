// Referencias tipadas a mano a las queries de Convex, SIN depender de
// convex/_generated/api. Ese archivo lo genera `npx convex dev` la primera
// vez que corre (necesita login por navegador, ver backend/CONVEX-SETUP.md)
// y hoy no existe en esta máquina — un import estático a "../../convex/_generated/api"
// rompería el build. `makeFunctionReference` construye la misma referencia
// que usaría el codegen, apuntando al nombre de function real
// ("archivo:export"), y los genéricos <Args, Return> son los tipos YA
// fijados en convex/developers.ts y src/lib/types.ts — no inventan forma
// nueva, sólo declaran la que el backend ya implementa.
//
// Cuando el dueño corra `npx convex dev`, este archivo puede reemplazarse
// por imports directos de `convex/_generated/api` sin tocar el resto de la
// capa de datos (src/lib/data-source.ts sigue recibiendo la misma forma).
import { makeFunctionReference } from "convex/server";
import type {
  EnsureResult,
  GetProfileResult,
  LinkGithubUsernameResult,
  ListTeamTableResult,
  OnboardingStatusResult,
} from "./types";

export const listTeamTableRef = makeFunctionReference<
  "query",
  Record<string, never>,
  ListTeamTableResult
>("developers:listTeamTable");

export const getProfileRef = makeFunctionReference<
  "query",
  { githubUsername: string },
  GetProfileResult | null
>("developers:getProfile");

export const onboardingStatusRef = makeFunctionReference<
  "query",
  Record<string, never>,
  OnboardingStatusResult | null
>("users:onboardingStatus");

export const usersEnsureRef = makeFunctionReference<
  "mutation",
  Record<string, never>,
  EnsureResult
>("users:ensure");

export const linkGithubUsernameRef = makeFunctionReference<
  "mutation",
  { githubUsername: string },
  LinkGithubUsernameResult | null
>("users:linkGithubUsername");
