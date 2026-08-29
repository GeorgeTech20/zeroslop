// resources.recommend — query INTERNA. No la llama el frontend ni el MCP
// oficial (que solo ve functions públicas); la llama developers.getProfile
// vía ctx.runQuery(internal.resources.recommend, ...). No genera recursos ni
// URLs — solo elige entre lo que ya está en la tabla `resources` (seed.ts).

import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { SkillTag } from "./types";

const skillTagValidator = v.union(
  v.literal("testing"),
  v.literal("architecture"),
  v.literal("security"),
  v.literal("typescript"),
  v.literal("debugging")
);

export const recommend = internalQuery({
  args: { skillTags: v.array(skillTagValidator) },
  handler: async (ctx, { skillTags }): Promise<Doc<"resources">[]> => {
    if (skillTags.length === 0) return [];

    const counts = new Map<SkillTag, number>();
    for (const tag of skillTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const orderedTags = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const picked: Doc<"resources">[] = [];
    const pickedIds = new Set<string>();

    for (const tag of orderedTags) {
      const matches = await ctx.db
        .query("resources")
        .filter((q) => q.eq(q.field("skillTag"), tag))
        .collect();

      for (const resource of matches) {
        if (picked.length === 3) break;
        if (pickedIds.has(resource._id)) continue;
        picked.push(resource);
        pickedIds.add(resource._id);
      }
      if (picked.length === 3) break;
    }

    return picked;
  },
});
