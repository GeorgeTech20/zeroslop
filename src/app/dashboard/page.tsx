import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { redirect } from "next/navigation";

// Destino único después de iniciar sesión. No es una pantalla: crea la cuenta
// en Convex si hace falta y manda a SU panel.
//
// Acá se cierra el hueco que dejaba la base vacía: Clerk creaba la sesión pero
// nadie llamaba nunca a users.ensure, así que no aparecía ni un user ni un
// developer. Ahora esto corre en el server component, justo después del login.
//
// El token va explícito: en el servidor no hay navegador que lo adjunte, y sin
// él ctx.auth.getUserIdentity() devuelve null aunque la sesión sea válida.
// Requiere el JWT template llamado "convex" en Clerk.
const PERFIL_DEMO = "mariafernandez";

export default async function DashboardPage() {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/dashboard");

  const user = await currentUser();

  // Orden de preferencia para el usuario de GitHub:
  //   1. cuenta de GitHub conectada → verificada por Clerk, es el mejor dato
  //   2. username de Clerk          → lo eligió la persona al registrarse
  const github =
    user?.externalAccounts?.find((a) => a.provider === "oauth_github")?.username ||
    user?.username ||
    null;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  let vinculado: string | null = null;

  if (convexUrl) {
    try {
      const token = await getToken({ template: "convex" });
      if (token) {
        const convex = new ConvexHttpClient(convexUrl);
        convex.setAuth(token);

        // Idempotente: si la fila ya existe, no la toca.
        await convex.mutation(anyApi.users.ensure, {});

        if (github) {
          try {
            const res = await convex.mutation(anyApi.users.linkGithubUsername, {
              githubUsername: github,
            });
            vinculado = res?.githubUsername ?? github;
          } catch {
            // Username inválido o ya tomado por otra cuenta: no es motivo para
            // dejar a la persona sin panel. Lo resuelve en /onboarding.
            vinculado = null;
          }
        }
      }
    } catch {
      // Sin JWT template o Convex caído: se sigue igual al panel, en vez de
      // dejar la sesión sin destino.
    }
  }

  // Un usuario recién registrado no tiene evaluaciones todavía: mandarlo a su
  // panel vacío es peor primera impresión que mostrarle el panel funcionando.
  redirect(`/developers/${vinculado || github || PERFIL_DEMO}`);
}
