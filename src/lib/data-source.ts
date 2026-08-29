// Bifurcación Convex-vs-mocks, contenida acá y en ningún otro lado. La
// pantalla server component (src/app/developers/[githubUsername]/page.tsx)
// llama a `loadDashboardData` y sólo decide, según `mode`, qué árbol montar
// (usePreloadedQuery necesita un ConvexProvider ancestro y un server
// component no puede llamarlo directo) — nunca vuelve a chequear la env var
// ni reimplementa el fallback.
import { preloadQuery } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { getProfileRef, listTeamTableRef } from "./convex-api";
import { getProfile, listTeamTable } from "./mock-data";
import type { GetProfileResult, ListTeamTableResult } from "./types";

export type DashboardData =
  | {
      mode: "convex";
      rowsPreloaded: Preloaded<typeof listTeamTableRef>;
      profilePreloaded: Preloaded<typeof getProfileRef>;
    }
  | {
      mode: "mocks";
      rows: ListTeamTableResult;
      profile: GetProfileResult | null;
    };

// El fallback a mocks existe porque hoy no hay deployment de Convex en
// ninguna máquina de esta oficina (no hay `~/.convex` ni
// NEXT_PUBLIC_CONVEX_URL — ver backend/CONVEX-SETUP.md, el login abre
// navegador y ningún agente puede completarlo). Deja de hacer falta el día
// que TODOS los entornos donde corre esta app (dev local incluido) tengan
// un deployment real seteado; hasta entonces la pantalla tiene que poder
// levantar sin Convex y sin romper.
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

  const [rowsPreloaded, profilePreloaded] = await Promise.all([
    preloadQuery(listTeamTableRef, {}),
    preloadQuery(getProfileRef, { githubUsername }),
  ]);

  return { mode: "convex", rowsPreloaded, profilePreloaded };
}
