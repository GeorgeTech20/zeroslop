// users.me / users.ensure / users.linkGithubUsername / users.onboardingStatus
// — el modelo de cuenta web (Clerk) y el puente hacia `developers`. Todas
// menos ensure/link sacan la identidad de ctx.auth.getUserIdentity(), NUNCA
// de un argumento: un userId por argumento sería spoofeable desde el
// cliente. evaluations.save (llamada por el MCP, sin sesión de Clerk) no
// toca este archivo ni gana requisito de auth.
//
// Migración al schema unificado: `users` ya no guarda `githubUsername`
// suelto, apunta a `developers` vía `developerId` (users.developerId puede
// ser un developer YA existente y sin user — p.ej. uno creado por un senior
// vía evaluations.save — o uno nuevo, creado acá en el onboarding). Los
// RETURN SHAPES de ensure/linkGithubUsername/onboardingStatus se mantienen
// IGUALES a como los consume el frontend (src/lib/types.ts:
// EnsureResult/LinkGithubUsernameResult/OnboardingStatusResult, todos con
// `githubUsername` plano) — el mapeo developerId->githubUsername se resuelve
// acá, así que src/ no se toca.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Regla real de GitHub: alfanumérico, guiones simples (no consecutivos, no
// al borde), máximo 39 caracteres.
const GITHUB_USERNAME_REGEX =
  /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user ?? null;
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No hay sesión de Clerk.");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (existing) {
      const developer = existing.developerId
        ? await ctx.db.get(existing.developerId)
        : null;
      return {
        githubUsername: developer?.githubUsername,
        onboardingCompletedAt: existing.onboardingCompletedAt,
      };
    }

    await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      name: identity.name,
      email: identity.email,
    });

    // Recién creado: sin developer vinculado todavía, onboarding sin completar.
    return { githubUsername: undefined, onboardingCompletedAt: undefined };
  },
});

export const linkGithubUsername = mutation({
  args: { githubUsername: v.string() },
  handler: async (ctx, { githubUsername }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No hay sesión de Clerk.");

    if (!GITHUB_USERNAME_REGEX.test(githubUsername)) {
      throw new Error(
        "Usuario de GitHub inválido: letras, números y guiones simples, máximo 39 caracteres."
      );
    }

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!me) {
      throw new Error("Todavía no existe el user — llamá a users.ensure primero.");
    }

    // El developer puede ya existir sin user (p.ej. un senior lo creó al
    // evaluarlo por primera vez desde la terminal, ver
    // convex/evaluations.ts) — en ese caso el onboarding lo vincula, no crea
    // uno nuevo.
    const matches = await ctx.db
      .query("developers")
      .withIndex("by_github_username", (q) =>
        q.eq("githubUsername", githubUsername)
      )
      .collect();
    if (matches.length > 1) {
      throw new Error(
        "Usuario de GitHub duplicado en developers — hay que arreglar la unicidad antes de vincular."
      );
    }

    let developer = matches[0];

    if (developer) {
      const takenBy = await ctx.db
        .query("users")
        .withIndex("by_developer", (q) => q.eq("developerId", developer!._id))
        .unique();
      if (takenBy && takenBy._id !== me._id) {
        throw new Error(
          `El usuario de GitHub "${githubUsername}" ya está vinculado a otra cuenta.`
        );
      }
    } else {
      const developerId = await ctx.db.insert("developers", {
        githubUsername,
        displayName: githubUsername,
        role: "developer",
      });
      const inserted = await ctx.db.get(developerId);
      if (!inserted) throw new Error("No se pudo crear el developer.");
      developer = inserted;
    }

    await ctx.db.patch(me._id, {
      developerId: developer._id,
      onboardingCompletedAt: Date.now(),
    });

    return { githubUsername: developer.githubUsername };
  },
});

export const onboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!me) {
      return {
        hasAccount: false,
        hasGithubUsername: false,
        hasFirstEvaluation: false,
        githubUsername: undefined,
      };
    }

    // El paso final del onboarding se completa solo, en vivo: esta query es
    // reactiva (Convex la re-suscribe por websocket), así que cuando el MCP
    // corre evaluations.save desde la terminal, hasFirstEvaluation pasa a
    // true en la pantalla sin que nadie apriete un botón.
    let githubUsername: string | undefined;
    let hasFirstEvaluation = false;

    if (me.developerId) {
      const developer = await ctx.db.get(me.developerId);
      githubUsername = developer?.githubUsername;
      if (developer) {
        const firstAssessment = await ctx.db
          .query("assessments")
          .withIndex("by_developer", (q) => q.eq("developerId", developer._id))
          .first();
        hasFirstEvaluation = firstAssessment !== null;
      }
    }

    return {
      hasAccount: true,
      hasGithubUsername: me.developerId !== undefined,
      hasFirstEvaluation,
      githubUsername,
    };
  },
});
