import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas vigentes (decisión del dueño, 2026-08-29 — ver CONTEXTO.md):
// - "/" landing, sign-in/sign-up y "/developers/[githubUsername]" son
//   públicas a propósito: el panel se comparte por URL y el jurado lo abre
//   sin cuenta. No cerrar "/developers/*" por iniciativa propia.
// - "/onboarding" y "/settings" requieren sesión.
// - "/skill/*" (public/skill/) es el .md real de la Skill que el paso 2 del
//   onboarding manda a copiar/pegar (ver StepInstallSkill.tsx): ese comando
//   corre en la TERMINAL del developer, sin cookie de sesión de Clerk, así
//   que tiene que quedar público — el matcher de abajo no excluye ".md" de
//   los estáticos, por eso hace falta la entrada explícita.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/developers/(.*)",
  "/skill/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // Sin esto, auth.protect() redirige al Account Portal alojado por Clerk
    // (*.accounts.dev) en vez de nuestro /sign-in — el signInUrl del
    // <ClerkProvider> (layout.tsx) sólo aplica a componentes de cliente,
    // no a este redirect hecho en el proxy antes de que React monte nada.
    // redirect_url queda armado a mano (perdemos el default de Clerk al
    // pisar unauthenticatedUrl): <SignIn/> ya lo lee solo y, una vez
    // logueado, manda de vuelta a la ruta protegida original en vez de
    // caer siempre en /onboarding.
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    await auth.protect({ unauthenticatedUrl: signInUrl.toString() });
  }
});

// Next.js 16 renombró middleware.ts -> proxy.ts, pero el matcher se
// mantiene igual. '/__clerk/:path*' va DESPUÉS de '/(api|trpc)(.*)' —lo
// pide el propio @clerk/nextjs 7.8.3 para su proxy de frontend API interno.
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
