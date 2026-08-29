// Capa de datos del panel. Una sola bifurcación, acá y en ningún otro lado.
//
// Apunta al deployment de Convex de NEXT_PUBLIC_CONVEX_URL vía la API HTTP
// pública (/api/query), no vía preloadQuery: así funciona contra cualquier
// deployment del equipo sin depender de tipos generados ni de que las
// functions se llamen igual que las nuestras.
//
// El backend de Bruno devuelve otra forma que la nuestra y no tiene
// `developers:listTeamTable`. Por eso el mapeo de abajo es defensivo: acepta
// las dos formas y, si algo no viene, no rompe la pantalla.
import { getProfile, listTeamTable } from "./mock-data";
import type {
  GetProfileResult,
  ListTeamTableResult,
  Resource,
  SkillTag,
} from "./types";

export type DashboardData = {
  mode: "convex" | "mocks";
  rows: ListTeamTableResult;
  profile: GetProfileResult | null;
};

const SKILL_TAGS: SkillTag[] = [
  "testing",
  "architecture",
  "security",
  "typescript",
  "debugging",
];

function asSkillTag(value: unknown): SkillTag {
  if (typeof value === "string") {
    if ((SKILL_TAGS as string[]).includes(value)) return value as SkillTag;
    // "authentication" existe en el esquema nuevo pero no en el union viejo
    // que consumen los componentes.
    if (value === "authentication") return "security";
  }
  return "architecture";
}

function num(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return c;
  }
  return 0;
}

function str(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return "";
}

async function convexQuery(path: string, args: Record<string, unknown>) {
  const base = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args, format: "json" }),
      cache: "no-store",
    });
    const body = await res.json();
    return body?.status === "success" ? body.value : null;
  } catch {
    // Deployment caído o sin red: se cae a los mocks, la pantalla no muere.
    return null;
  }
}

// Acepta la forma de Bruno ({ developer, metrics, latestAssessment,
// learningResources }) y también la nuestra ({ githubUsername, name, metrics,
// latestEvaluation, recommendedResources }).
function mapProfile(raw: unknown): GetProfileResult | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, any>;
  const dev = (p.developer ?? p) as Record<string, any>;

  const githubUsername = str(dev.githubUsername, p.githubUsername);
  if (!githubUsername) return null;

  const m = (p.metrics ?? {}) as Record<string, any>;
  const metrics = {
    comprensionDecisiones: num(m.comprensionDecisiones, m.decisionUnderstanding),
    deteccionRiesgos: num(m.deteccionRiesgos, m.riskDetection),
    calidadExplicacion: num(m.calidadExplicacion, m.explanationQuality),
    overallScore: num(m.overallScore, m.total),
  };

  const a = (p.latestAssessment ?? p.latestEvaluation) as Record<string, any> | null;
  const scores = (a?.scores ?? a ?? {}) as Record<string, any>;
  const latestEvaluation = a
    ? {
        pullRequestUrl: str(a.prUrl, a.pullRequestUrl),
        conceptualQuestion: str(a.conceptual?.question, a.conceptualQuestion),
        conceptualAnswer: str(a.conceptual?.answer, a.conceptualAnswer),
        conceptualScore: num(scores.decisionUnderstanding, a.conceptualScore),
        mutationDescription: str(
          a.mutation?.patch
            ? `${str(a.mutation?.question)}\n\n\`\`\`diff\n${a.mutation.patch}\n\`\`\``
            : undefined,
          a.mutationDescription
        ),
        mutationAnswer: str(a.mutation?.answer, a.mutationAnswer),
        mutationScore: num(scores.riskDetection, a.mutationScore),
        explanationQuality: num(scores.explanationQuality, a.explanationQuality),
        overallScore: num(scores.total, a.overallScore),
        createdAt: num(a.createdAt, a._creationTime, Date.now()),
      }
    : null;

  const rawResources = (p.learningResources ?? p.recommendedResources ?? []) as any[];
  const recommendedResources: Resource[] = rawResources.slice(0, 3).map((r, i) => ({
    _id: str(r?._id, `res_${i}`),
    title: str(r?.title, "Recurso"),
    url: str(r?.url, "#"),
    skillTag: asSkillTag(r?.skillTag ?? r?.areas?.[0]),
  }));

  return {
    githubUsername,
    name: str(dev.displayName, dev.name, p.name, githubUsername),
    metrics,
    latestEvaluation,
    recommendedResources,
  };
}

export async function loadDashboardData(
  githubUsername: string
): Promise<DashboardData> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return {
      mode: "mocks",
      rows: listTeamTable(),
      profile: getProfile(githubUsername),
    };
  }

  const [rawRows, rawProfile] = await Promise.all([
    convexQuery("developers:listTeamTable", {}),
    convexQuery("developers:getProfile", { githubUsername }),
  ]);

  const profile = mapProfile(rawProfile);

  // Sin deployment usable no se muestra una pantalla rota: se cae a los mocks,
  // que son los datos de la demo.
  if (!profile) {
    return {
      mode: "mocks",
      rows: listTeamTable(),
      profile: getProfile(githubUsername),
    };
  }

  // El backend de Bruno no expone listTeamTable. Si no está, la tabla del
  // equipo se arma con el developer que sí conocemos, en vez de quedar vacía.
  const rows: ListTeamTableResult = Array.isArray(rawRows)
    ? (rawRows as ListTeamTableResult)
    : [
        {
          githubUsername: profile.githubUsername,
          name: profile.name,
          comprensionDecisiones: profile.metrics.comprensionDecisiones,
          deteccionRiesgos: profile.metrics.deteccionRiesgos,
          calidadExplicacion: profile.metrics.calidadExplicacion,
          overallScore: profile.metrics.overallScore,
          evaluationsCount: profile.latestEvaluation ? 1 : 0,
        },
      ];

  return { mode: "convex", rows, profile };
}
