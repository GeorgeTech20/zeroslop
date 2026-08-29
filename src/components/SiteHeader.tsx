import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import styles from "./SiteHeader.module.css";

// @clerk/nextjs 7.8.3 es "Core 3": <SignedIn>/<SignedOut> quedaron como
// stubs que TIRAN en runtime (ver removedControlComponents.js del propio
// paquete — el build de esta app falló contra eso). El reemplazo vigente
// en esta versión es <Show when="signed-in" | "signed-out">, no adivinado:
// confirmado leyendo los .d.mts instalados en node_modules/.pnpm.
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark}>
          Zero<span className={styles.wordmarkAccent}>Slop</span>
        </Link>

        <nav className={styles.nav} aria-label="Secciones de la landing">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#panel">El panel</a>
          <a href="#alcance">Qué no hace</a>
        </nav>

        <div className={styles.authSlot}>
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className={styles.ghostBtn}>Iniciar sesión</button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className={styles.primaryBtn}>Registrarse</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Configuración"
                  href="/settings"
                  labelIcon={<span aria-hidden>⚙</span>}
                />
              </UserButton.MenuItems>
            </UserButton>
          </Show>
        </div>
      </div>
    </header>
  );
}
