// Schema real de Convex — 3 tablas, nombres e índices exactos según
// .claude/agents/backend-convex.md. Espejo 1:1 de
// workspace/zeroslop/backend/convex-schema-draft.ts (ya validado contra
// mock-data.ts en Fase 1).

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  developers: defineTable({
    githubUsername: v.string(),
    name: v.string(),
    seeded: v.optional(v.boolean()), // true = perfil ficticio precargado
  }).index("by_username", ["githubUsername"]),

  evaluations: defineTable({
    githubUsername: v.string(),
    pullRequestUrl: v.string(),
    conceptualQuestion: v.string(),
    conceptualAnswer: v.string(),
    conceptualScore: v.number(), // 0-10
    mutationDescription: v.string(), // el patch hipotético mostrado
    mutationAnswer: v.string(),
    mutationScore: v.number(), // 0-10
    explanationQuality: v.number(), // 0-10, promedio de ambas respuestas
    overallScore: v.number(), // avg(conceptualScore, mutationScore)
    createdAt: v.number(),
  }).index("by_username", ["githubUsername"]),

  resources: defineTable({
    title: v.string(),
    url: v.string(),
    skillTag: v.union(
      v.literal("testing"),
      v.literal("architecture"),
      v.literal("security"),
      v.literal("typescript"),
      v.literal("debugging")
    ),
  }),

  // Cuenta web (Clerk). Distinta de `developers` a propósito: `developers`
  // es "alguien con evaluaciones" (lo crea la Skill desde terminal, sin
  // auth), `users` es "alguien logueado en la web". El puente entre ambas
  // es githubUsername, y se arma recién cuando el usuario completa el
  // onboarding — antes de eso un user no tiene developer, y los 2
  // developers seeded no tienen user.
  users: defineTable({
    clerkUserId: v.string(),
    githubUsername: v.optional(v.string()), // solo existe post-onboarding
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    createdAt: v.number(),
    onboardingCompletedAt: v.optional(v.number()),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_github_username", ["githubUsername"]),
});
