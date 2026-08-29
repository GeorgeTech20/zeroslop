// developers.getProfile y developers.listTeamTable — mismas firmas que
// src/lib/mock-data.ts (getProfile/listTeamTable), campo por campo contra
// src/lib/types.ts. No se tocan los nombres: la Skill y el frontend ya los
// asumen así.

import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import { computeMetrics, inferSkillTags, latestEvaluation } from "./metrics";

export const listTeamTable = query({
  args: {},
  handler: async (ctx) => {
    const developers = await ctx.db.query("developers").collect();

    return Promise.all(
      developers.map(async (developer) => {
        const evaluations = await ctx.db
          .query("evaluations")
          .withIndex("by_username", (q) =>
            q.eq("githubUsername", developer.githubUsername)
          )
          .collect();

        const metrics = computeMetrics(evaluations);

        return {
          githubUsername: developer.githubUsername,
          name: developer.name,
          comprensionDecisiones: metrics.comprensionDecisiones,
          deteccionRiesgos: metrics.deteccionRiesgos,
          calidadExplicacion: metrics.calidadExplicacion,
          overallScore: metrics.overallScore,
          evaluationsCount: evaluations.length,
        };
      })
    );
  },
});

export const getProfile = query({
  args: { githubUsername: v.string() },
  handler: async (ctx, { githubUsername }) => {
    const developer = await ctx.db
      .query("developers")
      .withIndex("by_username", (q) => q.eq("githubUsername", githubUsername))
      .unique();
    if (!developer) return null;

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_username", (q) => q.eq("githubUsername", githubUsername))
      .collect();

    const metrics = computeMetrics(evaluations);
    const latest = latestEvaluation(evaluations);
    const skillTags = evaluations.flatMap(inferSkillTags);
    const recommendedResources = await ctx.runQuery(
      internal.resources.recommend,
      { skillTags }
    );

    return {
      githubUsername: developer.githubUsername,
      name: developer.name,
      metrics,
      // Un developer sin evaluaciones es estado válido (el tipo declara null):
      // se muestra el perfil vacío, no se rompe la query.
      latestEvaluation: latest
        ? {
            pullRequestUrl: latest.pullRequestUrl,
            conceptualQuestion: latest.conceptualQuestion,
            conceptualAnswer: latest.conceptualAnswer,
            conceptualScore: latest.conceptualScore,
            mutationDescription: latest.mutationDescription,
            mutationAnswer: latest.mutationAnswer,
            mutationScore: latest.mutationScore,
            explanationQuality: latest.explanationQuality,
            overallScore: latest.overallScore,
            createdAt: latest.createdAt,
          }
        : null,
      recommendedResources,
    };
  },
});
