// users.me / users.ensure / users.linkGithubUsername / users.onboardingStatus
// — el modelo de cuenta web (Clerk) y el puente hacia `developers`. Todas
// menos ensure/link sacan la identidad de ctx.auth.getUserIdentity(), NUNCA
// de un argumento: un userId por argumento sería spoofeable desde el
// cliente. evaluations.save (llamada por la Skill desde terminal, sin
// sesión de Clerk) no toca este archivo ni gana requisito de auth.

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
      return {
        githubUsername: existing.githubUsername,
        onboardingCompletedAt: existing.onboardingCompletedAt,
      };
    }

    await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      name: identity.name,
      email: identity.email,
      createdAt: Date.now(),
    });

    // Recién creado: sin githubUsername todavía, onboarding sin completar.
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

    const takenBy = await ctx.db
      .query("users")
      .withIndex("by_github_username", (q) =>
        q.eq("githubUsername", githubUsername)
      )
      .unique();
    if (takenBy && takenBy._id !== me._id) {
      throw new Error(
        `El usuario de GitHub "${githubUsername}" ya está vinculado a otra cuenta.`
      );
    }

    await ctx.db.patch(me._id, {
      githubUsername,
      onboardingCompletedAt: Date.now(),
    });

    return await ctx.db.get(me._id);
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
    // reactiva (Convex la re-suscribe por websocket), así que cuando la
    // Skill corre evaluations.save desde la terminal, hasFirstEvaluation
    // pasa a true en la pantalla sin que nadie apriete un botón.
    let hasFirstEvaluation = false;
    if (me.githubUsername) {
      const firstEvaluation = await ctx.db
        .query("evaluations")
        .withIndex("by_username", (q) =>
          q.eq("githubUsername", me.githubUsername!)
        )
        .first();
      hasFirstEvaluation = firstEvaluation !== null;
    }

    return {
      hasAccount: true,
      hasGithubUsername: me.githubUsername !== undefined,
      hasFirstEvaluation,
      githubUsername: me.githubUsername,
    };
  },
});
