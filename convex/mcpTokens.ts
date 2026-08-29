// mcpTokens.issue / revoke / list — emisión y gestión de los Bearer que
// consume el MCP remoto de Bruno (zero-slop-mcp/convex-dropin/evaluations.ts).
// Sin esto nadie puede autenticar la Skill desde la terminal: no hay sesión
// de Clerk ahí, solo un Bearer -> sha256 -> mcpTokens.tokenHash.
//
// Se guarda SOLO el hash. El texto plano se genera y se devuelve UNA vez, en
// `issue`, y no vuelve a poder leerse — ni siquiera nosotros lo persistimos.
// El hash tiene que salir EXACTAMENTE igual que su src/lib/token.ts
// (`createHash('sha256').update(token, 'utf8').digest('hex')`) o
// evaluations.save nunca encuentra el token cuando su servidor lo hashea del
// lado de ellos.
//
// Verificado antes de asumir nada: node:crypto no corre en el runtime
// default de mutations/queries de Convex (haría falta "use node", y ahí sólo
// se pueden declarar actions — pierden las garantías transaccionales que
// quiero para un insert simple). La Web Crypto API sí corre en ese runtime
// default (`crypto.getRandomValues`, `crypto.subtle.digest`) — por eso
// convex/tsconfig.json ya trae "dom" en "lib", que es lo que tipa `crypto`
// como global. Con eso alcanza: no hace falta ninguna action con "use node"
// acá.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Mismo algoritmo que src/lib/token.ts de zero-slop-mcp, hecho con Web
// Crypto en vez de node:crypto: sha256 en hex sobre los bytes utf8 del token.
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return bytesToHex(new Uint8Array(digest));
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export const issue = mutation({
  args: { label: v.string() },
  handler: async (ctx, { label }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No hay sesión de Clerk.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!me?.developerId) {
      throw new Error(
        "Completá el onboarding (vincular tu usuario de GitHub) antes de emitir un token MCP."
      );
    }

    const token = randomToken();
    const tokenHash = await sha256Hex(token);

    const tokenId = await ctx.db.insert("mcpTokens", {
      developerId: me.developerId,
      tokenHash,
      label,
    });

    // Única vez que el texto plano existe fuera de la memoria del cliente.
    return { tokenId, token, label };
  },
});

export const revoke = mutation({
  args: { tokenId: v.id("mcpTokens") },
  handler: async (ctx, { tokenId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("No hay sesión de Clerk.");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!me?.developerId) {
      throw new Error("No hay developer vinculado a esta cuenta.");
    }

    const token = await ctx.db.get(tokenId);
    if (!token || token.developerId !== me.developerId) {
      throw new Error("Token no encontrado.");
    }

    // Nunca se borra la fila: evaluations.save filtra por revokedAt === undefined.
    if (token.revokedAt === undefined) {
      await ctx.db.patch(tokenId, { revokedAt: Date.now() });
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!me?.developerId) return [];

    const developerId = me.developerId;
    const tokens = await ctx.db
      .query("mcpTokens")
      .withIndex("by_developer", (q) => q.eq("developerId", developerId))
      .collect();

    // Nunca tokenHash ni el texto plano — sólo lo que hace falta para
    // decidir cuál revocar.
    return tokens.map((token) => ({
      _id: token._id,
      label: token.label,
      lastUsedAt: token.lastUsedAt,
      revokedAt: token.revokedAt,
    }));
  },
});
