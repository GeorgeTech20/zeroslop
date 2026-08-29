// seed.run — mutation idempotente contra el schema unificado. Carga los 2
// developers ficticios (role: "developer") + sus assessments (con feedback y
// learningAreas creíbles, no la heurística vieja) + el catálogo de
// learningResources (con description y provider, que antes no existían).
// Corrida más de una vez no duplica filas: developers por githubUsername,
// assessments por prUrl (índice by_pr_url), learningResources por url.
// El tercer developer (el real, el que corre la Skill/MCP) NO se carga acá.
//
// Los scores y textos son los mismos que usaba el seed viejo
// (overallScore/total idénticos: total = avg(decisionUnderstanding,
// riskDetection)), sólo reacomodados a la forma nueva: conceptual/mutation
// separados, feedback por métrica, y learningAreas explícitas en vez de
// inferidas por score bajo.

import { mutation } from "./_generated/server";

const LEARNING_RESOURCES = [
  {
    title: "Testing JavaScript — Kent C. Dodds",
    description:
      "Curso completo de testing en JavaScript: unit, integration y e2e con Jest y Testing Library.",
    provider: "testingjavascript.com",
    url: "https://testingjavascript.com",
    areas: ["testing"] as const,
  },
  {
    title: "Given-When-Then y patrones de test legibles — Martin Fowler",
    description:
      "Cómo estructurar casos de test para que se lean como especificación, no como implementación.",
    provider: "martinfowler.com",
    url: "https://martinfowler.com/bliki/GivenWhenThen.html",
    areas: ["testing"] as const,
  },
  {
    title: "OWASP Top 10",
    description:
      "Los diez riesgos de seguridad más críticos en aplicaciones web, con ejemplos y mitigaciones.",
    provider: "OWASP",
    url: "https://owasp.org/www-project-top-ten/",
    areas: ["security", "authentication"] as const,
  },
  {
    title: "Verificación de firmas de webhooks — Stripe Docs",
    description:
      "Por qué y cómo verificar la firma de un webhook antes de confiar en su payload.",
    provider: "Stripe",
    url: "https://docs.stripe.com/webhooks#verify-official-libraries",
    areas: ["security"] as const,
  },
  {
    title: "A Philosophy of Software Design — John Ousterhout (resumen)",
    description:
      "Complejidad, módulos profundos y cómo tomar decisiones de diseño que no se paguen después.",
    provider: "Stanford",
    url: "https://web.stanford.edu/~ouster/cgi-bin/book.php",
    areas: ["architecture"] as const,
  },
  {
    title: "Use The Index, Luke — cómo indexar bases de datos relacionales",
    description:
      "Guía práctica de índices SQL: qué orden de columnas usar y por qué importa para cada query.",
    provider: "use-the-index-luke.com",
    url: "https://use-the-index-luke.com/",
    areas: ["architecture"] as const,
  },
  {
    title: "TypeScript Handbook",
    description: "Referencia oficial del lenguaje: tipos, genéricos y el sistema de inferencia.",
    provider: "TypeScript",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    areas: ["typescript"] as const,
  },
  {
    title: "Effective TypeScript — patrones para tipar APIs externas",
    description:
      "Patrones para tipar fronteras de código (APIs externas, datos sin validar) sin recurrir a `any`.",
    provider: "effectivetypescript.com",
    url: "https://effectivetypescript.com/",
    areas: ["typescript"] as const,
  },
  {
    title: "Debugging: 9 reglas para encontrar cualquier bug",
    description:
      "Método sistemático para acotar la causa de un bug en vez de cambiar código a prueba y error.",
    provider: "debuggingrules.com",
    url: "https://debuggingrules.com/",
    areas: ["debugging"] as const,
  },
  {
    title: "Chrome DevTools — Guía de debugging de JavaScript",
    description: "Breakpoints, watch expressions y el panel de sources para depurar JS en vivo.",
    provider: "Chrome DevTools",
    url: "https://developer.chrome.com/docs/devtools/javascript",
    areas: ["debugging"] as const,
  },
];

const MARIA_ASSESSMENTS = [
  {
    repository: "zeroslop-demo/app",
    prTitle: "Mover el token de sesión a cookie HttpOnly",
    prUrl: "https://github.com/zeroslop-demo/app/pull/142",
    changeSummary:
      "Reemplaza el token de auth guardado en localStorage por una cookie HttpOnly + Secure + SameSite=Lax.",
    conceptual: {
      question:
        "¿Por qué moviste el token de autenticación a una cookie HttpOnly en vez de guardarlo en localStorage?",
      answer:
        "Porque localStorage es accesible desde JS, así que cualquier XSS podría robarse el token directamente. Con HttpOnly el navegador nunca expone la cookie a document.cookie, y sumé SameSite=Lax para mitigar CSRF en la mayoría de los casos sin romper los links entrantes.",
    },
    mutation: {
      question:
        "¿Qué pasa si se elimina el flag Secure de la cookie de sesión en producción?",
      patch:
        '- res.cookie("session", token, { httpOnly: true, secure: true, sameSite: "lax" });\n+ res.cookie("session", token, { httpOnly: true, sameSite: "lax" });',
      answer:
        "Sin Secure, un atacante en la misma red (Wi-Fi público, proxy MITM) podría interceptar la cookie en texto plano y robarse la sesión completa. Ese flag nunca debería sacarse en producción, sólo tendría sentido omitirlo en dev local sobre HTTP.",
    },
    scores: { decisionUnderstanding: 9, riskDetection: 8, explanationQuality: 8.5, total: 8.5 },
    feedback: {
      decisionUnderstanding:
        "Justificación sólida: nombra el vector de ataque exacto (XSS + localStorage) y explica la mitigación adicional (SameSite) sin que se la pidan.",
      riskDetection:
        "Identifica correctamente el escenario de red insegura y por qué Secure es no-negociable en producción.",
      explanationQuality:
        "Respuestas claras y técnicamente precisas en ambos casos, sin relleno.",
    },
    learningAreas: ["security"] as const,
  },
  {
    repository: "zeroslop-demo/app",
    prTitle: "Índice compuesto (userId, createdAt) en pedidos",
    prUrl: "https://github.com/zeroslop-demo/app/pull/118",
    changeSummary:
      "Agrega un índice compuesto a la tabla orders para acelerar el query del dashboard de pedidos.",
    conceptual: {
      question:
        "¿Por qué agregaste un índice compuesto (userId, createdAt) en la tabla de pedidos en vez de dos índices separados?",
      answer:
        "Porque las queries del dashboard siempre filtran por userId y después ordenan por createdAt. Un índice compuesto cubre ese patrón en un solo lookup, mientras que con dos índices separados Postgres tendría que combinar bitmap scans, que es más lento para este caso de uso.",
    },
    mutation: {
      question: "¿Qué pasa si se invierte el orden de las columnas del índice?",
      patch:
        "- CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);\n+ CREATE INDEX idx_orders_user_created ON orders (created_at, user_id);",
      answer:
        "Rompería el uso eficiente del índice para el filtro por usuario, porque la primera columna de un índice compuesto tiene que ser la que se usa con igualdad en el WHERE. Con el orden invertido, Postgres tendría que escanear rangos de fecha completos y filtrar por usuario después.",
    },
    scores: { decisionUnderstanding: 8, riskDetection: 7, explanationQuality: 7.5, total: 7.5 },
    feedback: {
      decisionUnderstanding:
        "Entiende bien el patrón de acceso real (filtro + orden) y por qué eso determina la elección del índice.",
      riskDetection:
        "Correcto sobre el orden de columnas, aunque podría precisar mejor el costo relativo del scan resultante.",
      explanationQuality: "Explicación técnica y directa, sin errores conceptuales.",
    },
    learningAreas: ["architecture"] as const,
  },
];

const LUIS_ASSESSMENTS = [
  {
    repository: "zeroslop-demo/app",
    prTitle: "Try/catch silencioso alrededor del proveedor de pagos",
    prUrl: "https://github.com/zeroslop-demo/app/pull/97",
    changeSummary:
      "Envuelve la llamada al proveedor de pagos en un try/catch que loguea y continúa el flujo.",
    conceptual: {
      question:
        "¿Por qué envolviste la llamada al proveedor de pagos en un try/catch que sólo loguea el error y sigue?",
      answer:
        "Para que no se caiga toda la app si falla el pago, así el usuario no ve una pantalla blanca.",
    },
    mutation: {
      question: "¿Qué pasa si se elimina la verificación de la firma del webhook antes de procesar el evento de pago?",
      patch:
        "- if (!verifyStripeSignature(req)) return res.status(400).end();\n  const event = parseWebhookEvent(req.body);\n+ const event = parseWebhookEvent(req.body);",
      answer: "No debería cambiar mucho, total el webhook viene de Stripe y ya confiamos en esa URL.",
    },
    scores: { decisionUnderstanding: 4, riskDetection: 3, explanationQuality: 3.5, total: 3.5 },
    feedback: {
      decisionUnderstanding:
        "Se queda en el síntoma (pantalla blanca) y no explica qué pasa con el pago que falló silenciosamente ni cómo se recupera ese estado.",
      riskDetection:
        "Punto ciego serio: confía en el origen de la URL en vez de en la firma criptográfica, que es justamente lo que impide que cualquiera falsifique el evento.",
      explanationQuality:
        "Respuestas cortas y sin justificar el razonamiento — hace falta profundizar el porqué, no sólo el qué.",
    },
    learningAreas: ["security", "debugging"] as const,
  },
  {
    repository: "zeroslop-demo/app",
    prTitle: "Mocks en vez de DB de test en el checkout",
    prUrl: "https://github.com/zeroslop-demo/app/pull/103",
    changeSummary:
      "Cambia el test de integración del checkout para usar mocks en vez de la base de datos de test.",
    conceptual: {
      question:
        "¿Por qué cambiaste el test de integración del checkout para usar mocks en vez de la base de datos de test?",
      answer:
        "Porque corría más rápido en mi máquina y no quería tener que levantar Docker para correr los tests.",
    },
    mutation: {
      question: "¿Qué pasa si se quita el rollback de la transacción al final de cada test de integración?",
      patch: "  afterEach(async () => {\n-   await db.rollback();\n  });",
      answer: "No estoy muy seguro, capaz queda alguna data vieja dando vueltas pero no creo que rompa los tests.",
    },
    scores: { decisionUnderstanding: 5, riskDetection: 4, explanationQuality: 4.5, total: 4.5 },
    feedback: {
      decisionUnderstanding:
        "La motivación es de conveniencia local, no de diseño de test: no considera que un mock puede divergir del comportamiento real de la DB (el riesgo que el propio proyecto sufrió antes).",
      riskDetection:
        "No conecta el rollback con el aislamiento entre tests — 'no creo que rompa' es una suposición, no un análisis del efecto en corridas siguientes.",
      explanationQuality:
        "Incertidumbre explícita ('no estoy muy seguro') sin intentar razonar la respuesta con lo que sí sabe del setup de tests.",
    },
    learningAreas: ["testing", "architecture"] as const,
  },
];

const SEEDED_DEVELOPERS = [
  {
    githubUsername: "mariafernandez",
    displayName: "María Fernández",
    assessments: MARIA_ASSESSMENTS,
  },
  {
    githubUsername: "luisrivera",
    displayName: "Luis Rivera",
    assessments: LUIS_ASSESSMENTS,
  },
];

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    let resourcesInserted = 0;
    const existingResources = await ctx.db.query("learningResources").collect();
    const existingResourceUrls = new Set(existingResources.map((r) => r.url));
    for (const resource of LEARNING_RESOURCES) {
      if (existingResourceUrls.has(resource.url)) continue;
      await ctx.db.insert("learningResources", {
        title: resource.title,
        description: resource.description,
        provider: resource.provider,
        url: resource.url,
        areas: [...resource.areas],
      });
      resourcesInserted++;
    }

    let developersInserted = 0;
    let assessmentsInserted = 0;
    for (const dev of SEEDED_DEVELOPERS) {
      let developer = await ctx.db
        .query("developers")
        .withIndex("by_github_username", (q) =>
          q.eq("githubUsername", dev.githubUsername)
        )
        .unique();

      if (!developer) {
        const developerId = await ctx.db.insert("developers", {
          githubUsername: dev.githubUsername,
          displayName: dev.displayName,
          role: "developer",
          seeded: true,
        });
        developer = await ctx.db.get(developerId);
        if (!developer) throw new Error("No se pudo crear el developer seeded.");
        developersInserted++;
      }

      for (const assessment of dev.assessments) {
        const existing = await ctx.db
          .query("assessments")
          .withIndex("by_pr_url", (q) => q.eq("prUrl", assessment.prUrl))
          .unique();
        if (existing) continue;

        await ctx.db.insert("assessments", {
          developerId: developer._id,
          repository: assessment.repository,
          prTitle: assessment.prTitle,
          prUrl: assessment.prUrl,
          changeSummary: assessment.changeSummary,
          conceptual: assessment.conceptual,
          mutation: assessment.mutation,
          scores: assessment.scores,
          feedback: assessment.feedback,
          learningAreas: [...assessment.learningAreas],
          notificationStatus: "skipped",
          notificationAttempts: 0,
        });
        assessmentsInserted++;
      }
    }

    return { developersInserted, assessmentsInserted, resourcesInserted };
  },
});
