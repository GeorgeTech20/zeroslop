// Schema unificado con el MCP de Bruno (zero-slop-mcp). Reemplaza el schema
// viejo de 3 tablas (developers/evaluations/resources) — ver
// docs/schema-unificado.ts para la propuesta original y docs/CHANGELOG-PIVOT.md
// para el porqué. `assessments` reemplaza a `evaluations`, `learningResources`
// reemplaza a `resources`, y se suman `mcpTokens` (Bearer del MCP) y los
// campos de `developers`/`users` que hacían falta para que ambos existan.
//
// Nombres e índices verificados contra su código real (convex-dropin/*.ts),
// no contra la propuesta a ciegas: developers usa by_github_username (así lo
// consulta evaluations.save y mcp.ts), assessments.scores/feedback tienen
// exactamente los campos que inserta evaluations.save, mcpTokens usa
// by_token_hash y developerId tal como los lee resolveToken.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const learningArea = v.union(
  v.literal("architecture"),
  v.literal("testing"),
  v.literal("security"),
  v.literal("authentication"),
  v.literal("debugging"),
  v.literal("typescript"),
);

const notificationStatus = v.union(
  v.literal("pending"), // recién guardada, n8n todavía no la tomó
  v.literal("sent"),    // Telegram entregado
  v.literal("failed"),  // falló y se puede reintentar
  v.literal("skipped"), // no hay senior asignado o no tiene telegramChatId
);

export default defineSchema({
  // ── Quién es quién ──────────────────────────────────────────────────────
  //
  // `developers` es la identidad de DOMINIO: existe porque tiene assessments,
  // la crea la Skill (o un senior) desde la terminal. No implica cuenta web.
  // `users` es la identidad de SESIÓN: la crea Clerk cuando alguien se
  // registra. No implica assessments.
  // El puente es users.developerId, y se arma en el onboarding
  // (convex/users.ts:linkGithubUsername). Los 2 perfiles de la demo son
  // developers sin user (seeded: true).
  developers: defineTable({
    githubUsername: v.string(),
    displayName: v.string(),

    role: v.union(v.literal("developer"), v.literal("senior")),

    // A quién se le notifica por Telegram cuando este developer es evaluado.
    seniorId: v.optional(v.id("developers")),

    // Chat de Telegram de ESTE developer (se usa cuando es senior de alguien).
    telegramChatId: v.optional(v.string()),

    // true = perfil ficticio precargado para la demo. Permite limpiarlos
    // después sin borrar gente real.
    seeded: v.optional(v.boolean()),
  })
    .index("by_github_username", ["githubUsername"])
    .index("by_senior", ["seniorId"]),

  // Cuenta web (Clerk). clerkUserId sale SIEMPRE de
  // ctx.auth.getUserIdentity().subject, nunca de un argumento: un argumento
  // sería spoofeable desde el cliente.
  users: defineTable({
    clerkUserId: v.string(),
    developerId: v.optional(v.id("developers")), // null hasta el onboarding
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.number()),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_developer", ["developerId"]),

  // ── Auth del MCP (la terminal no tiene sesión de Clerk) ─────────────────
  //
  // Se guarda SOLO el hash. El token en claro se muestra una única vez, al
  // crearlo (convex/mcpTokens.ts:issue), y no se puede volver a ver.
  mcpTokens: defineTable({
    developerId: v.id("developers"),
    tokenHash: v.string(),  // sha256(token) en hex. Nunca el token en claro.
    label: v.string(),      // "laptop del trabajo" — para saber cuál revocar
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()), // presente = muerto, no borrar la fila
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_developer", ["developerId"]),

  // ── La evaluación ───────────────────────────────────────────────────────
  assessments: defineTable({
    developerId: v.id("developers"),

    repository: v.string(),
    prTitle: v.string(),
    prUrl: v.string(),
    changeSummary: v.string(),

    conceptual: v.object({
      question: v.string(),
      answer: v.string(),
    }),

    // question, patch y answer separados: la UI renderiza el diff como diff.
    mutation: v.object({
      question: v.string(),
      patch: v.string(),
      answer: v.string(),
    }),

    scores: v.object({
      decisionUnderstanding: v.number(), // 0-10
      riskDetection: v.number(),         // 0-10
      explanationQuality: v.number(),    // 0-10
      // OJO: total = avg(decisionUnderstanding, riskDetection).
      // NO incluye explanationQuality. Si se cambia la fórmula, cambia acá,
      // en la Skill y en el panel — o los números dejan de coincidir.
      total: v.number(),
    }),

    // Sin esto un 4 es solo un número. Es lo que el developer realmente lee.
    feedback: v.object({
      decisionUnderstanding: v.string(),
      riskDetection: v.string(),
      explanationQuality: v.string(),
    }),

    // Las decide el evaluador al puntuar, no una heurística posterior.
    learningAreas: v.array(learningArea),

    // Estado de la notificación de n8n. Top-level (no anidado) para poder
    // indexarlo sin dudas.
    notificationStatus,
    notificationAttempts: v.number(),
    notificationLastAttemptAt: v.optional(v.number()),
    notificationSentAt: v.optional(v.number()),
    notificationError: v.optional(v.string()),
  })
    .index("by_developer", ["developerId"])
    .index("by_pr_url", ["prUrl"])
    // La usa el cron de reintentos y, si se elige el modo poll, n8n.
    .index("by_notification_status", ["notificationStatus"]),

  // ── Catálogo de aprendizaje ─────────────────────────────────────────────
  //
  // Sin índice a propósito: Convex no indexa contenido de arrays, y el
  // catálogo es chico (decenas de filas). Se hace .collect() y se filtra por
  // area en JS (ver convex/resources.ts). Si algún día crece, va un search
  // index.
  learningResources: defineTable({
    title: v.string(),
    description: v.string(),
    provider: v.string(),
    url: v.string(),
    areas: v.array(learningArea),
  }),
});

// ── Cosas que el schema NO puede garantizar y hay que hacer en código ─────
//
// 1. UNICIDAD. Los índices de Convex no son únicos. Antes de insertar hay que
//    chequear a mano: githubUsername en developers, clerkUserId en users,
//    tokenHash en mcpTokens. Si no, aparecen duplicados silenciosos.
// 2. FECHAS. No hay createdAt en ninguna tabla: Convex ya da `_creationTime`
//    en cada documento. Tener las dos cosas es tener dos fuentes de verdad.
// 3. UN ASSESSMENT POR PR. El índice by_pr_url permite buscarlo, pero no
//    impide duplicados. Se guarda historial y el panel muestra el más
//    reciente (developers.ts:getProfile ya funciona así).
