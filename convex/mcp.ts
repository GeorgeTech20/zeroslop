// Copiado 1:1 de convex-dropin/mcp.ts del repo de Bruno (zero-slop-mcp). Su
// servidor MCP remoto la llama para resolver un Bearer (ya hasheado por él,
// con el mismo sha256 hex que exige mcpTokens.tokenHash) a un developer,
// antes de que el LLM del lado de la terminal arme el payload de
// evaluations.save. No se edita "para mejorarlo": ver nota en evaluations.ts.

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const resolveToken = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, { tokenHash }) => {
    const rows = await ctx.db
      .query("mcpTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .collect();

    const row = rows.find((item) => item.revokedAt === undefined);
    if (!row) {
      return null;
    }

    const developer = await ctx.db.get(row.developerId);
    if (!developer) {
      return null;
    }

    await ctx.db.patch(row._id, { lastUsedAt: Date.now() });

    return {
      developerId: developer._id,
      githubUsername: developer.githubUsername,
    };
  },
});
