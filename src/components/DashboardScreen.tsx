"use client";

import type { GetProfileResult, ListTeamTableResult } from "@/lib/types";
import { TeamTable } from "./TeamTable";
import { DetailPanel } from "./DetailPanel";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./DashboardScreen.module.css";

interface DashboardScreenProps {
  rows: ListTeamTableResult;
  profile: GetProfileResult | null;
  selectedUsername: string;
}

export function DashboardScreen({
  rows,
  profile,
  selectedUsername,
}: DashboardScreenProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.wordmark}>ZeroSlop</span>
        <ThemeToggle />
      </header>
      <main className={styles.grid}>
        <section className={styles.tableColumn} aria-label="Equipo">
          <TeamTable rows={rows} selectedUsername={selectedUsername} />
        </section>
        <section className={styles.detailColumn} aria-label="Detalle del developer">
          <DetailPanel profile={profile} selectedUsername={selectedUsername} />
        </section>
      </main>
    </div>
  );
}
