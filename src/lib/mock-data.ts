// Catálogo de data mockeada — Fase 1 (Convex real todavía no existe).
// `listTeamTable()` y `getProfile()` tienen la MISMA forma que tendrán las
// queries `developers.listTeamTable` y `developers.getProfile` de Convex,
// para que los componentes las sustituyan sin cambios cuando el backend exista.
// Espejo de workspace/zeroslop/backend/mock-data.ts (sala backend-convex).
//
// Reglas:
// - 2 developers seeded (ficticios), el tercero (real) NO se precarga acá.
// - overallScore = promedio de comprensionDecisiones y deteccionRiesgos.
// - Los recursos son datos precargados, no se generan en runtime.

import type {
  Evaluation,
  GetProfileResult,
  ListTeamTableResult,
  RecommendResult,
  Resource,
  SkillTag,
  TeamTableRow,
} from "./types";

interface SeededDeveloper {
  githubUsername: string;
  name: string;
  seeded: true;
  evaluations: Evaluation[];
}

// --- Recursos precargados (6-10, catálogo fijo) ---

export const RESOURCES: Resource[] = [
  {
    _id: "res_1",
    title: "Testing JavaScript — Kent C. Dodds",
    url: "https://testingjavascript.com",
    skillTag: "testing",
  },
  {
    _id: "res_2",
    title: "Given-When-Then y patrones de test legibles — Martin Fowler",
    url: "https://martinfowler.com/bliki/GivenWhenThen.html",
    skillTag: "testing",
  },
  {
    _id: "res_3",
    title: "OWASP Top 10",
    url: "https://owasp.org/www-project-top-ten/",
    skillTag: "security",
  },
  {
    _id: "res_4",
    title: "Verificación de firmas de webhooks — Stripe Docs",
    url: "https://docs.stripe.com/webhooks#verify-official-libraries",
    skillTag: "security",
  },
  {
    _id: "res_5",
    title: "A Philosophy of Software Design — John Ousterhout (resumen)",
    url: "https://web.stanford.edu/~ouster/cgi-bin/book.php",
    skillTag: "architecture",
  },
  {
    _id: "res_6",
    title: "Use The Index, Luke — cómo indexar bases de datos relacionales",
    url: "https://use-the-index-luke.com/",
    skillTag: "architecture",
  },
  {
    _id: "res_7",
    title: "TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/handbook/intro.html",
    skillTag: "typescript",
  },
  {
    _id: "res_8",
    title: "Effective TypeScript — patrones para tipar APIs externas",
    url: "https://effectivetypescript.com/",
    skillTag: "typescript",
  },
  {
    _id: "res_9",
    title: "Debugging: 9 reglas para encontrar cualquier bug",
    url: "https://debuggingrules.com/",
    skillTag: "debugging",
  },
  {
    _id: "res_10",
    title: "Chrome DevTools — Guía de debugging de JavaScript",
    url: "https://developer.chrome.com/docs/devtools/javascript",
    skillTag: "debugging",
  },
];

// --- Developers seeded con evaluaciones inventadas creíbles ---

const MARIA_EVALUATIONS: Evaluation[] = [
  {
    _id: "eval_maria_1",
    githubUsername: "mariafernandez",
    pullRequestUrl: "https://github.com/zeroslop-demo/app/pull/142",
    conceptualQuestion:
      "¿Por qué moviste el token de autenticación a una cookie HttpOnly en vez de guardarlo en localStorage?",
    conceptualAnswer:
      "Porque localStorage es accesible desde JS, así que cualquier XSS podría robarse el token directamente. Con HttpOnly el navegador nunca expone la cookie a document.cookie, y sumé SameSite=Lax para mitigar CSRF en la mayoría de los casos sin romper los links entrantes.",
    conceptualScore: 9,
    mutationDescription:
      "Patch hipotético: se elimina el flag `Secure` de la cookie de sesión en el entorno de producción, dejándola viajar también por HTTP plano.\n\n```diff\n- res.cookie(\"session\", token, { httpOnly: true, secure: true, sameSite: \"lax\" });\n+ res.cookie(\"session\", token, { httpOnly: true, sameSite: \"lax\" });\n```",
    mutationAnswer:
      "Sin Secure, un atacante en la misma red (Wi-Fi público, proxy MITM) podría interceptar la cookie en texto plano y robarse la sesión completa. Ese flag nunca debería sacarse en producción, sólo tendría sentido omitirlo en dev local sobre HTTP.",
    mutationScore: 8,
    explanationQuality: 8.5,
    overallScore: 8.5,
    createdAt: 1755043200000,
  },
  {
    _id: "eval_maria_2",
    githubUsername: "mariafernandez",
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

const LUIS_EVALUATIONS: Evaluation[] = [
  {
    _id: "eval_luis_1",
    githubUsername: "luisrivera",
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
    _id: "eval_luis_2",
    githubUsername: "luisrivera",
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

const SEEDED_DEVELOPERS: SeededDeveloper[] = [
  {
    githubUsername: "mariafernandez",
    name: "María Fernández",
    seeded: true,
    evaluations: MARIA_EVALUATIONS,
  },
  {
    githubUsername: "luisrivera",
    name: "Luis Rivera",
    seeded: true,
    evaluations: LUIS_EVALUATIONS,
  },
];

// --- Helpers de agregación (misma lógica que tendrán las queries reales) ---

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function computeMetrics(evaluations: Evaluation[]) {
  const comprensionDecisiones = average(
    evaluations.map((e) => e.conceptualScore)
  );
  const deteccionRiesgos = average(evaluations.map((e) => e.mutationScore));
  const calidadExplicacion = average(
    evaluations.map((e) => e.explanationQuality)
  );
  const overallScore = average([comprensionDecisiones, deteccionRiesgos]);
  return { comprensionDecisiones, deteccionRiesgos, calidadExplicacion, overallScore };
}

function latest(evaluations: Evaluation[]): Evaluation | null {
  return [...evaluations].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

// Umbral por debajo del cual un score "arrastra" su skillTag hacia recomendaciones.
const LOW_SCORE_THRESHOLD = 6;

// Mapeo heurístico pregunta→skillTag, hasta tener clasificación real por LLM.
function inferSkillTags(evaluation: Evaluation): SkillTag[] {
  const tags: SkillTag[] = [];
  if (evaluation.mutationScore < LOW_SCORE_THRESHOLD) {
    tags.push("security", "debugging");
  }
  if (evaluation.conceptualScore < LOW_SCORE_THRESHOLD) {
    tags.push("architecture", "testing");
  }
  return tags;
}

// --- resources.recommend ---

export function recommend(skillTags: SkillTag[]): RecommendResult {
  if (skillTags.length === 0) return [];

  const counts = new Map<SkillTag, number>();
  for (const tag of skillTags) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const orderedTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const picked: Resource[] = [];
  for (const tag of orderedTags) {
    for (const resource of RESOURCES) {
      if (resource.skillTag === tag && !picked.includes(resource)) {
        picked.push(resource);
      }
      if (picked.length === 3) return picked;
    }
  }
  return picked.slice(0, 3);
}

// --- developers.listTeamTable ---

export function listTeamTable(): ListTeamTableResult {
  return SEEDED_DEVELOPERS.map((dev): TeamTableRow => {
    const metrics = computeMetrics(dev.evaluations);
    return {
      githubUsername: dev.githubUsername,
      name: dev.name,
      comprensionDecisiones: metrics.comprensionDecisiones,
      deteccionRiesgos: metrics.deteccionRiesgos,
      calidadExplicacion: metrics.calidadExplicacion,
      overallScore: metrics.overallScore,
      evaluationsCount: dev.evaluations.length,
    };
  });
}

// --- developers.getProfile ---

export function getProfile(githubUsername: string): GetProfileResult | null {
  const dev = SEEDED_DEVELOPERS.find(
    (d) => d.githubUsername === githubUsername
  );
  if (!dev) return null;

  const metrics = computeMetrics(dev.evaluations);
  const latestEval = latest(dev.evaluations);
  const skillTags = dev.evaluations.flatMap(inferSkillTags);

  return {
    githubUsername: dev.githubUsername,
    name: dev.name,
    metrics,
    // Un developer sin evaluaciones es estado válido (el tipo declara null).
    latestEvaluation: latestEval
      ? {
          pullRequestUrl: latestEval.pullRequestUrl,
          conceptualQuestion: latestEval.conceptualQuestion,
          conceptualAnswer: latestEval.conceptualAnswer,
          conceptualScore: latestEval.conceptualScore,
          mutationDescription: latestEval.mutationDescription,
          mutationAnswer: latestEval.mutationAnswer,
          mutationScore: latestEval.mutationScore,
          explanationQuality: latestEval.explanationQuality,
          overallScore: latestEval.overallScore,
          createdAt: latestEval.createdAt,
        }
      : null,
    recommendedResources: recommend(skillTags),
  };
}
