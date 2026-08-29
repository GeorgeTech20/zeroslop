import { ConvexDashboardScreen } from "@/components/ConvexDashboardScreen";
import { DashboardScreen } from "@/components/DashboardScreen";
import type { Metadata } from "next";
import { loadDashboardData } from "@/lib/data-source";

// El layout raíz ahora titula la landing; el panel conserva el suyo.
export const metadata: Metadata = {
  title: "ZeroSlop — Panel del developer",
  description:
    "Panel de observabilidad ZeroSlop: comprensión de decisiones, detección de riesgos y calidad de explicación por developer.",
};

export default async function DeveloperPage(
  props: PageProps<"/developers/[githubUsername]">
) {
  const { githubUsername } = await props.params;
  const data = await loadDashboardData(githubUsername);

  if (data.mode === "convex") {
    return (
      <ConvexDashboardScreen
        rowsPreloaded={data.rowsPreloaded}
        profilePreloaded={data.profilePreloaded}
        selectedUsername={githubUsername}
      />
    );
  }

  return (
    <DashboardScreen
      rows={data.rows}
      profile={data.profile}
      selectedUsername={githubUsername}
    />
  );
}
