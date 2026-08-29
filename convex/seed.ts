// seed.run — mutation idempotente. Carga los 2 developers ficticios + sus
// evaluaciones + los 10 recursos, con la data EXACTA de
// src/lib/mock-data.ts (mismos textos, mismos scores, mismas URLs, mismos
// timestamps). Correrla más de una vez no duplica filas: cada bloque
// chequea existencia antes de insertar (developers por githubUsername,
// evaluations por githubUsername+pullRequestUrl, resources por url).
// El tercer developer (el real) NO se carga acá.

import { mutation } from "./_generated/server";

const RESOURCES = [
  {
    title: "Testing JavaScript — Kent C. Dodds",
    url: "https://testingjavascript.com",
    skillTag: "testing" as const,
  },
  {
    title: "Given-When-Then y patrones de test legibles — Martin Fowler",
    url: "https://martinfowler.com/bliki/GivenWhenThen.html",
    skillTag: "testing" as const,
  },
  {
    title: "OWASP Top 10",
    url: "https://owasp.org/www-project-top-ten/",
    skillTag: "security" as const,
  },
  {
    title: "Verificación de firmas de webhooks — Stripe Docs",
    url: "https://docs.stripe.com/webhooks#verify-official-libraries",
    skillTag: "security" as const,
  },
  {
    title: "A Philosophy of Software Design — John Ousterhout (resumen)",
    url: "https://web.stanford.edu/~ouster/cgi-bin/book.php",
    skillTag: "architecture" as const,
  },
  {
    title: "Use The Index, Luke — cómo indexar bases de datos relacionales",
    url: "https://use-the-index-luke.com/",
    skillTag: "architecture" as const,
  },
  {
    title: "TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    skillTag: "typescript" as const,
  },
  {
    title: "Effective TypeScript — patrones para tipar APIs externas",
    url: "https://effectivetypescript.com/",
    skillTag: "typescript" as const,
  },
  {
    title: "Debugging: 9 reglas para encontrar cualquier bug",
    url: "https://debuggingrules.com/",
    skillTag: "debugging" as const,
  },
  {
    title: "Chrome DevTools — Guía de debugging de JavaScript",
    url: "https://developer.chrome.com/docs/devtools/javascript",
    skillTag: "debugging" as const,
  },
];

const MARIA_EVALUATIONS = [
  {
    pullRequestUrl: "https://github.com/zeroslop-demo/app/pull/142",
    conceptualQuestion:
      "¿Por qué moviste el token de autenticación a una cookie HttpOnly en vez de guardarlo en localStorage?",
    conceptualAnswer:
      "Porque localStorage es accesible desde JS, así que cualquier XSS podría robarse el token directamente. Con HttpOnly el navegador nunca expone la cookie a document.cookie, y sumé SameSite=Lax para mitigar CSRF en la mayoría de los casos sin romper los links entrantes.",
    conceptualScore: 9,
    mutationDescription:
      'Patch hipotético: se elimina el flag `Secure` de la cookie de sesión en el entorno de producción, dejándola viajar también por HTTP plano.\n\n```diff\n- res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "lax" });\n+ res.cookie("session", token, { httpOnly: true, sameSite: "lax" });\n```',
    mutationAnswer:
      "Sin Secure, un atacante en la misma red (Wi-Fi público, proxy MITM) podría interceptar la cookie en texto plano y robarse la sesión completa. Ese flag nunca debería sacarse en producción, sólo tendría sentido omitirlo en dev local sobre HTTP.",
    mutationScore: 8,
    explanationQuality: 8.5,
    overallScore: 8.5,
    createdAt: 1755043200000,
  },
  {
    pullRequestUrl: "https://github.com/zeroslop-demo/app/pull/118",
    conceptualQuestion:
      "¿Por qué agregaste un índice compuesto (userId, createdAt) en la tabla de pedidos en vez de dos índices separados?",
    conceptualAnswer:
      "Porque las queries del dashboard siempre filtran por userId y después ordenan por createdAt. Un índice compuesto cubre ese patrón en un solo lookup, mientras que con dos índices separados Postgres tendría que combinar bitmap scans, que es más lento para este caso de uso.",
    conceptualScore: 8,
    mutationDescription:
      "Patch hipotético: se invierte el orden de las columnas del índice a (createdAt, userId).\n\n```diff\n- CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);\n+ CREATE INDEX idx_orders_user_created ON orders (created_at, user_id);\n```",
    mutationAnswer:
      "Rompería el uso eficiente del índice para el filtro por usuario, porque la primera columna de un índice compuesto tiene que ser la que se usa con igualdad en el WHERE. Con el orden invertido, Postgres tendría que escanear rangos de fecha completos y filtrar por usuario después.",
    mutationScore: 7,
    explanationQuality: 7.5,
    overallScore: 7.5,
    createdAt: 1752278400000,
  },
];

const LUIS_EVALUATIONS = [
  {
    pullRequestUrl: "https://github.com/zeroslop-demo/app/pull/97",
    conceptualQuestion:
      "¿Por qué envolviste la llamada al proveedor de pagos en un try/catch que sólo loguea el error y sigue?",
    conceptualAnswer:
      "Para que no se caiga toda la app si falla el pago, así el usuario no ve una pantalla blanca.",
    conceptualScore: 4,
    mutationDescription:
      "Patch hipotético: se elimina la verificación de la firma del webhook antes de procesar el evento de pago.\n\n```diff\n- if (!verifyStripeSignature(req)) return res.status(400).end();\n  const event = parseWebhookEvent(req.body);\n+ const event = parseWebhookEvent(req.body);\n```",
    mutationAnswer:
      "No debería cambiar mucho, total el webhook viene de Stripe y ya confiamos en esa URL.",
    mutationScore: 3,
    explanationQuality: 3.5,
    overallScore: 3.5,
    createdAt: 1754006400000,
  },
  {
    pullRequestUrl: "https://github.com/zeroslop-demo/app/pull/103",
    conceptualQuestion:
      "¿Por qué cambiaste el test de integración del checkout para usar mocks en vez de la base de datos de test?",
    conceptualAnswer:
      "Porque corría más rápido en mi máquina y no quería tener que levantar Docker para correr los tests.",
    conceptualScore: 5,
    mutationDescription:
      "Patch hipotético: se quita el rollback de la transacción al final de cada test de integración.\n\n```diff\n  afterEach(async () => {\n-   await db.rollback();\n  });\n```",
    mutationAnswer:
      "No estoy muy seguro, capaz queda alguna data vieja dando vueltas pero no creo que rompa los tests.",
    mutationScore: 4,
    explanationQuality: 4.5,
    overallScore: 4.5,
    createdAt: 1750291200000,
  },
];

const SEEDED_DEVELOPERS = [
  {
    githubUsername: "mariafernandez",
    name: "María Fernández",
    evaluations: MARIA_EVALUATIONS,
  },
  {
    githubUsername: "luisrivera",
    name: "Luis Rivera",
    evaluations: LUIS_EVALUATIONS,
  },
];

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    let resourcesInserted = 0;
    const existingResources = await ctx.db.query("resources").collect();
    const existingResourceUrls = new Set(existingResources.map((r) => r.url));
    for (const resource of RESOURCES) {
      if (existingResourceUrls.has(resource.url)) continue;
      await ctx.db.insert("resources", resource);
      resourcesInserted++;
    }

    let developersInserted = 0;
    let evaluationsInserted = 0;
    for (const dev of SEEDED_DEVELOPERS) {
      const developer = await ctx.db
        .query("developers")
        .withIndex("by_username", (q) =>
          q.eq("githubUsername", dev.githubUsername)
        )
        .unique();

      if (!developer) {
        await ctx.db.insert("developers", {
          githubUsername: dev.githubUsername,
          name: dev.name,
          seeded: true,
        });
        developersInserted++;
      }

      const existingEvaluations = await ctx.db
        .query("evaluations")
        .withIndex("by_username", (q) =>
          q.eq("githubUsername", dev.githubUsername)
        )
        .collect();
      const existingPrUrls = new Set(
        existingEvaluations.map((e) => e.pullRequestUrl)
      );

      for (const evaluation of dev.evaluations) {
        if (existingPrUrls.has(evaluation.pullRequestUrl)) continue;
        await ctx.db.insert("evaluations", {
          githubUsername: dev.githubUsername,
          ...evaluation,
        });
        evaluationsInserted++;
      }
    }

    return { developersInserted, evaluationsInserted, resourcesInserted };
  },
});
