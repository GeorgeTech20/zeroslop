"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import type { getProfileRef, listTeamTableRef } from "@/lib/convex-api";
import { DashboardScreen } from "./DashboardScreen";

interface ConvexDashboardScreenProps {
  rowsPreloaded: Preloaded<typeof listTeamTableRef>;
  profilePreloaded: Preloaded<typeof getProfileRef>;
  selectedUsername: string;
}

// Resuelve los preloaded de Convex a la misma forma de rows/profile que
// DashboardScreen ya consumía en modo mocks — se re-renderiza solo cuando la
// Skill guarda una evaluación nueva (usePreloadedQuery se suscribe en vivo).
// DashboardScreen no sabe ni le importa de dónde salieron los datos.
export function ConvexDashboardScreen({
  rowsPreloaded,
  profilePreloaded,
  selectedUsername,
}: ConvexDashboardScreenProps) {
  const rows = usePreloadedQuery(rowsPreloaded);
  const profile = usePreloadedQuery(profilePreloaded);

  return (
    <DashboardScreen
      rows={rows}
      profile={profile}
      selectedUsername={selectedUsername}
    />
  );
}
