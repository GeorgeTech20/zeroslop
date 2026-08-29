// developers.getProfile y developers.listTeamTable — leen `assessments`
// (schema unificado) pero DEVUELVEN exactamente la misma forma que ya
// consume el frontend (src/lib/types.ts: TeamTableRow / GetProfileResult /
// LatestEvaluation): el mapeo inglés→español (scores.decisionUnderstanding
// -> comprensionDecisiones, etc.) se hace acá, no en los componentes, que no
// se tocan.
//
// Dos cosas nuevas respecto de antes de la migración:
// - `latestEvaluation.feedback`: el feedback por métrica que guarda
//   evaluations.save y que antes no existía en el perfil.
// - `mutationDescription` se reconstruye a partir de `mutation.question` +
//   `mutation.patch` (separados en el schema nuevo para que la UI pueda
//   renderear el diff aparte) con el mismo formato que ya sabe parsear
//   MutationPatch.tsx: prosa libre seguida de un fence ```diff.

import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { SkillTag } from "./types";
import { computeMetrics, latestAssessment } from "./metrics";

function buildMutationDescription(mutation: Doc<"assessments">["mutation"]): string {
  return `${mutation.question}\n\n\`\`\`diff\n${mutation.patch}\n\`\`\``;
}

export const listTeamTable = query({
  args: {},
  handler: async (ctx) => {
    const developers = await ctx.db.query("developers").collect();

    return Promise.all(
      developers.map(async (developer) => {
        const assessments = await ctx.db
          .query("assessments")
          .withIndex("by_developer", (q) => q.eq("developerId", developer._id))
          .collect();

        const metrics = computeMetrics(assessments);

        return {
          githubUsername: developer.githubUsername,
          name: developer.displayName,
          comprensionDecisiones: metrics.comprensionDecisiones,
          deteccionRiesgos: metrics.deteccionRiesgos,
          calidadExplicacion: metrics.calidadExplicacion,
          overallScore: metrics.overallScore,
          evaluationsCount: assessments.length,
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
      .withIndex("by_github_username", (q) => q.eq("githubUsername", githubUsername))
      .unique();
    if (!developer) return null;

    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_developer", (q) => q.eq("developerId", developer._id))
      .collect();

    const metrics = computeMetrics(assessments);
    const latest = latestAssessment(assessments);
    const learningAreas = assessments.flatMap((a) => a.learningAreas);
    // Anotación explícita: sin ella TS entra en referencia circular al inferir
    // el tipo de retorno de este handler a través de internal.resources.recommend.
    const recommendedResources: {
      _id: Id<"learningResources">;
      title: string;
      url: string;
      skillTag: SkillTag;
    }[] = await ctx.runQuery(
      internal.resources.recommend,
      { learningAreas }
    );

    return {
      githubUsername: developer.githubUsername,
      name: developer.displayName,
      metrics,
      // Un developer sin evaluaciones es estado válido (el tipo declara null):
      // se muestra el perfil vacío, no se rompe la query.
      latestEvaluation: latest
        ? {
            pullRequestUrl: latest.prUrl,
            conceptualQuestion: latest.conceptual.question,
            conceptualAnswer: latest.conceptual.answer,
            conceptualScore: latest.scores.decisionUnderstanding,
            mutationDescription: buildMutationDescription(latest.mutation),
            mutationAnswer: latest.mutation.answer,
            mutationScore: latest.scores.riskDetection,
            explanationQuality: latest.scores.explanationQuality,
            overallScore: latest.scores.total,
            createdAt: latest._creationTime,
            feedback: {
              comprensionDecisiones: latest.feedback.decisionUnderstanding,
              deteccionRiesgos: latest.feedback.riskDetection,
              calidadExplicacion: latest.feedback.explanationQuality,
            },
          }
        : null,
      recommendedResources,
    };
  },
});
