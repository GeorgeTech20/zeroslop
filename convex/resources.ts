// resources.recommend — query INTERNA. La llama developers.getProfile vía
// ctx.runQuery(internal.resources.recommend, ...); no la llama el frontend
// ni el MCP oficial. Cruza los `learningAreas` reales de los assessments del
// developer (los eligió el evaluador al puntuar) contra
// `learningResources.areas` — se elimina la heurística vieja de inferir
// tags por score bajo (vivía en metrics.ts como inferSkillTags y ya no
// aplica: el schema unificado no infiere nada, lo declara la evaluación).
//
// El frontend (src/lib/types.ts) no se toca y sigue esperando la forma
// vieja de Resource: { _id, title, url, skillTag } con UN solo tag del
// union de 5 (ResourceList.tsx y resource-explanations.ts hacen
// `switch (resource.skillTag)`). `learningResources.areas` es un ARRAY y
// admite "authentication", que no existe en ese union viejo — se colapsa a
// "security" (mismo bucket narrativo: punto ciego de seguridad). Esto es un
// mapeo nuestro para no romper componentes ya construidos, no algo que pida
// el contrato de Bruno. Si frontend-dashboard quiere consumir
// `areas`/`description`/`provider` tal cual en el futuro, hay que
// coordinarlo — de momento esos dos campos no viajan en la respuesta.

import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

const learningAreaValidator = v.union(
  v.literal("architecture"),
  v.literal("testing"),
  v.literal("security"),
  v.literal("authentication"),
  v.literal("debugging"),
  v.literal("typescript")
);

type LearningArea =
  | "architecture"
  | "testing"
  | "security"
  | "authentication"
  | "debugging"
  | "typescript";

type LegacySkillTag =
  | "testing"
  | "architecture"
  | "security"
  | "typescript"
  | "debugging";

function legacySkillTagFor(areas: LearningArea[]): LegacySkillTag {
  for (const area of areas) {
    if (area === "authentication") continue;
    return area;
  }
  return "security"; // única area sin equivalente directo en el union viejo
}

export const recommend = internalQuery({
  args: { learningAreas: v.array(learningAreaValidator) },
  handler: async (ctx, { learningAreas }) => {
    if (learningAreas.length === 0) return [];

    const counts = new Map<LearningArea, number>();
    for (const area of learningAreas) {
      counts.set(area, (counts.get(area) ?? 0) + 1);
    }
    const orderedAreas = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([area]) => area);

    // Sin índice a propósito (ver schema.ts): catálogo chico, se filtra en JS.
    const catalog = await ctx.db.query("learningResources").collect();

    const picked: Doc<"learningResources">[] = [];
    const pickedIds = new Set<string>();

    for (const area of orderedAreas) {
      for (const resource of catalog) {
        if (picked.length === 3) break;
        if (pickedIds.has(resource._id)) continue;
        if (!resource.areas.includes(area)) continue;
        picked.push(resource);
        pickedIds.add(resource._id);
      }
      if (picked.length === 3) break;
    }

    return picked.map((resource) => ({
      _id: resource._id,
      title: resource.title,
      url: resource.url,
      skillTag: legacySkillTagFor(resource.areas as LearningArea[]),
    }));
  },
});
