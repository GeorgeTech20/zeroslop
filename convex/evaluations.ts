// evaluations.save — la única mutation que llama la Skill zeroslop-pr-check
// (paso 7 de .claude/skills/zeroslop-pr-check/SKILL.md) vía el MCP oficial
// de Convex (tool `run`). Recibe el resultado completo de la evaluación,
// hace upsert de developers si el username no existe, guarda la evaluación
// y devuelve { githubUsername }.

import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const save = mutation({
  args: {
    githubUsername: v.string(),
    pullRequestUrl: v.string(),
    conceptualQuestion: v.string(),
    conceptualAnswer: v.string(),
    conceptualScore: v.number(),
    mutationDescription: v.string(),
    mutationAnswer: v.string(),
    mutationScore: v.number(),
    explanationQuality: v.number(),
    overallScore: v.number(),
  },
  handler: async (ctx, args) => {
    const { githubUsername, ...evaluation } = args;

    const developer = await ctx.db
      .query("developers")
      .withIndex("by_username", (q) => q.eq("githubUsername", githubUsername))
      .unique();

    if (!developer) {
      // El tercer developer (real) no está seeded — se crea acá, la primera
      // vez que corre el flujo real. No conocemos su nombre completo, así
      // que arrancamos con el username y se puede ajustar a mano después.
      await ctx.db.insert("developers", {
        githubUsername,
        name: githubUsername,
        seeded: false,
      });
    }

    await ctx.db.insert("evaluations", {
      githubUsername,
      ...evaluation,
      createdAt: Date.now(),
    });

    return { githubUsername };
  },
});
