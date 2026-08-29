import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "./page.module.css";

const DEMO_PROFILES = [
  { githubUsername: "mariafernandez", name: "María Fernández" },
  { githubUsername: "luisrivera", name: "Luis Rivera" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>comprensión, no autoría</p>
        <h1 className={styles.heroTitle}>
          Comprensión demostrada,
          <br />
          antes de que exista la PR.
        </h1>
        <p className={styles.heroSubtitle}>
          ZeroSlop evalúa si quien abre una PR entiende su propio cambio: una
          pregunta conceptual sobre una decisión real del diff, y una
          mutación hipotética que rompería algo importante. Corre en tu
          terminal, dentro de Claude Code — no es un escáner que dice
          &ldquo;esto lo escribió una IA&rdquo;.
        </p>
        <div className={styles.heroActions}>
          <Link
            href={`/developers/${DEMO_PROFILES[0].githubUsername}`}
            className={styles.primaryCta}
          >
            Ver panel demo →
          </Link>
          <Link
            href={`/developers/${DEMO_PROFILES[1].githubUsername}`}
            className={styles.secondaryCta}
          >
            o el perfil de {DEMO_PROFILES[1].name}
          </Link>
        </div>
      </section>

      <section id="como-funciona" className={styles.steps}>
        <h2 className={styles.sectionTitle}>Cómo funciona</h2>
        <ol className={styles.stepList}>
          <li className={styles.step}>
            <span className={styles.stepNumber}>01</span>
            <h3>Pregunta conceptual</h3>
            <p>
              Antes de crear la PR, la Skill <code>zeroslop-pr-check</code>{" "}
              lee tu diff completo y te hace una pregunta sobre una decisión
              real que tomaste — no una trivia genérica.
            </p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNumber}>02</span>
            <h3>Mutación hipotética</h3>
            <p>
              Te muestra un patch que <strong>no está</strong> en tu diff, en
              texto plano en la terminal, y te pregunta por qué sería
              peligroso aplicarlo. Tu working tree nunca se toca.
            </p>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNumber}>03</span>
            <h3>Puntuación al panel del equipo</h3>
            <p>
              Ambas respuestas se puntúan 0–10 contra una rúbrica generada de
              antemano. La PR se crea igual, siempre — el score solo queda
              registrado.
            </p>
          </li>
        </ol>
      </section>

      <section className={styles.mutation}>
        <div className={styles.mutationText}>
          <h2 className={styles.sectionTitle}>
            El momento que importa: la mutación
          </h2>
          <p>
            No preguntamos si el código funciona — eso ya lo revisan los
            tests. Preguntamos si la persona que lo mandó entiende{" "}
            <em>por qué</em> una variante cercana sería peligrosa.
          </p>
        </div>
        <div className={styles.diffCard}>
          <p className={styles.diffLabel}>Ejemplo ilustrativo</p>
          <pre className={styles.diffBlock}>
            <code>
              <span className={styles.diffCtx}>
                {"  if (!isValidSignature(req.headers, secret)) {"}
              </span>
              {"\n"}
              <span className={styles.diffRemoved}>
                {"-   return res.status(401).end();"}
              </span>
              {"\n"}
              <span className={styles.diffAdded}>
                {"+   // TODO: revisar antes de prod"}
              </span>
              {"\n"}
              <span className={styles.diffAdded}>
                {"+   console.warn(\"firma inválida, sigo igual\");"}
              </span>
              {"\n"}
              <span className={styles.diffCtx}>{"  }"}</span>
            </code>
          </pre>
          <p className={styles.diffQuestion}>
            ¿Por qué este cambio es crítico y no debería aplicarse?
          </p>
        </div>
      </section>

      <section id="panel" className={styles.panel}>
        <h2 className={styles.sectionTitle}>Así llega al panel del equipo</h2>
        <p className={styles.panelIntro}>
          Cada evaluación produce tres métricas. <code>overallScore</code> es
          el promedio de las primeras dos.
        </p>
        <div className={styles.meters}>
          <div className={styles.meter}>
            <span className={styles.meterLabel}>comprensionDecisiones</span>
            <div className={styles.meterTrack}>
              <div
                className={`${styles.meterFill} ${styles.meterFillIris}`}
                style={{ width: "82%" }}
              />
            </div>
          </div>
          <div className={styles.meter}>
            <span className={styles.meterLabel}>deteccionRiesgos</span>
            <div className={styles.meterTrack}>
              <div
                className={`${styles.meterFill} ${styles.meterFillVoltio}`}
                style={{ width: "74%" }}
              />
            </div>
          </div>
          <div className={styles.meter}>
            <span className={styles.meterLabel}>calidadExplicacion</span>
            <div className={styles.meterTrack}>
              <div
                className={`${styles.meterFill} ${styles.meterFillBruma}`}
                style={{ width: "88%" }}
              />
            </div>
          </div>
        </div>
        <p className={styles.panelExample}>(valores de ejemplo)</p>
      </section>

      <section id="alcance" className={styles.scope}>
        <h2 className={styles.sectionTitle}>Lo que ZeroSlop no hace</h2>
        <ul className={styles.scopeList}>
          <li>No hay integración con GitHub App.</li>
          <li>No hay CI ni webhooks corriendo en tu repo.</li>
          <li>
            Una puntuación baja <strong>nunca</strong> bloquea la PR — se crea
            siempre.
          </li>
          <li>No detecta &ldquo;código de IA&rdquo;: mide comprensión, no autoría.</li>
        </ul>
      </section>

      <section className={styles.demoCta}>
        <h2 className={styles.sectionTitle}>Mirá el panel en acción</h2>
        <p className={styles.panelIntro}>
          Dos perfiles de demo, con evaluaciones ya cargadas.
        </p>
        <div className={styles.demoGrid}>
          {DEMO_PROFILES.map((profile) => (
            <Link
              key={profile.githubUsername}
              href={`/developers/${profile.githubUsername}`}
              className={styles.demoCard}
            >
              <span className={styles.demoAvatar}>
                {profile.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span>
                <span className={styles.demoName}>{profile.name}</span>
                <span className={styles.demoHandle}>
                  /developers/{profile.githubUsername}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>ZeroSlop</span>
        <span>Corre como Skill de Claude Code — no un servicio en tu CI.</span>
      </footer>
      </main>
    </>
  );
}
