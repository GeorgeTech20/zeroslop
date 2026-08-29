// Emisión de tokens MCP desde la CLI, para probar sin pasar por la web.
//
// Es `internalMutation` a propósito: las functions públicas de Convex las puede
// llamar cualquier cliente, y una que emite tokens para un githubUsername
// arbitrario sería un agujero. Las internas solo se alcanzan con la admin key
// (`npx convex run`) o desde otra function.
//
// El camino real de producto es `mcpTokens.issue`, que exige sesión de Clerk.
// Esto existe para diagnosticar la integración con el MCP del compañero.
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const issueForUsername = internalMutation({
  args: {
    githubUsername: v.string(),
    label: v.string(),
    role: v.optional(v.union(v.literal("developer"), v.literal("senior"))),
  },
  handler: async (ctx, { githubUsername, label, role }) => {
    let developer = await ctx.db
      .query("developers")
      .withIndex("by_github_username", (q) => q.eq("githubUsername", githubUsername))
      .unique();

    if (!developer) {
      const id = await ctx.db.insert("developers", {
        githubUsername,
        displayName: githubUsername,
        role: role ?? "senior",
      });
      developer = await ctx.db.get(id);
    }
    if (!developer) throw new Error("No se pudo crear el developer");

    // 32 bytes al azar en hex. El texto plano se devuelve una sola vez; en la
    // base queda únicamente el sha256, igual que espera src/lib/token.ts del
    // servidor MCP.
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const token = [...raw].map((b) => b.toString(16).padStart(2, "0")).join("");

    await ctx.db.insert("mcpTokens", {
      developerId: developer._id,
      tokenHash: await sha256Hex(token),
      label,
    });

    return {
      token,
      githubUsername: developer.githubUsername,
      role: developer.role,
    };
  },
});
