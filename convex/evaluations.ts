// Copiado 1:1 de convex-dropin/evaluations.ts del repo de Bruno
// (zero-slop-mcp). Es el contrato real que llama su servidor MCP remoto vía
// el cliente de Convex (Bearer -> sha256 -> mcpTokens, NUNCA
// ctx.auth.getUserIdentity()). No se edita "para mejorarlo": si algo no
// calza con el resto de nuestro código, se ajusta el resto, no esto — así lo
// pide el encargo de migración.

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const learningArea = v.union(
  v.literal("architecture"),
  v.literal("testing"),
  v.literal("security"),
  v.literal("authentication"),
  v.literal("debugging"),
  v.literal("typescript"),
);

const criterionScores = v.object({
  decisionUnderstanding: v.number(),
  riskDetection: v.number(),
  explanationQuality: v.number(),
});

function computeTotal(scores: {
  decisionUnderstanding: number;
  riskDetection: number;
}): number {
  return Math.round(((scores.decisionUnderstanding + scores.riskDetection) / 2) * 10) / 10;
}

function assertScore(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    throw new Error(`${name} must be between 0 and 10`);
  }
}

export const save = mutation({
  args: {
    tokenHash: v.string(),
    githubUsername: v.string(),
    repository: v.string(),
    prTitle: v.string(),
    prUrl: v.string(),
    changeSummary: v.string(),
    conceptual: v.object({
      question: v.string(),
      answer: v.string(),
    }),
    mutation: v.object({
      question: v.string(),
      patch: v.string(),
      answer: v.string(),
    }),
    scores: criterionScores,
    feedback: v.object({
      decisionUnderstanding: v.string(),
      riskDetection: v.string(),
      explanationQuality: v.string(),
    }),
    learningAreas: v.array(learningArea),
  },
  handler: async (ctx, args) => {
    // Terminal path: mcpTokens only. Never ctx.auth.getUserIdentity() / Clerk.
    assertScore("decisionUnderstanding", args.scores.decisionUnderstanding);
    assertScore("riskDetection", args.scores.riskDetection);
    assertScore("explanationQuality", args.scores.explanationQuality);

    const tokenRows = await ctx.db
      .query("mcpTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .collect();
    const tokenRow = tokenRows.find((item) => item.revokedAt === undefined);
    if (!tokenRow) {
      throw new Error("Unknown or revoked MCP token");
    }

    const caller = await ctx.db.get(tokenRow.developerId);
    if (!caller) {
      throw new Error("Token is not linked to a developer");
    }

    await ctx.db.patch(tokenRow._id, { lastUsedAt: Date.now() });

    const matches = await ctx.db
      .query("developers")
      .withIndex("by_github_username", (q) => q.eq("githubUsername", args.githubUsername))
      .collect();
    if (matches.length > 1) {
      throw new Error("Duplicate githubUsername in developers; fix uniqueness before saving");
    }

    // Anotación agregada de nuestro lado: nuestro tsconfig es estricto y más
    // abajo se le asigna un ctx.db.get(), que puede ser null. El comportamiento
    // no cambia — el chequeo de null que sigue ya estaba. Reportar al autor.
    let subject: Doc<"developers"> | null = matches[0] ?? null;
    let developerCreated = false;

    if (!subject) {
      if (caller.role !== "senior") {
        throw new Error(`Unknown githubUsername: ${args.githubUsername}`);
      }
      const subjectId = await ctx.db.insert("developers", {
        githubUsername: args.githubUsername,
        displayName: args.githubUsername,
        role: "developer",
        seniorId: caller._id,
      });
      subject = await ctx.db.get(subjectId);
      if (!subject) {
        throw new Error("Failed to create developer");
      }
      developerCreated = true;
    }

    const isSelf = caller._id === subject._id;
    const isSenior = caller.role === "senior" && subject.seniorId === caller._id;
    if (!isSelf && !isSenior) {
      throw new Error("Caller cannot submit an assessment for this developer");
    }

    const scores = {
      ...args.scores,
      total: computeTotal(args.scores),
    };

    const assessmentId = await ctx.db.insert("assessments", {
      developerId: subject._id,
      repository: args.repository,
      prTitle: args.prTitle,
      prUrl: args.prUrl,
      changeSummary: args.changeSummary,
      conceptual: args.conceptual,
      mutation: args.mutation,
      scores,
      feedback: args.feedback,
      learningAreas: [...new Set(args.learningAreas)],
      notificationStatus: "pending",
      notificationAttempts: 0,
    });

    return {
      assessmentId,
      developerId: subject._id,
      githubUsername: subject.githubUsername,
      scores,
      developerCreated,
    };
  },
});
