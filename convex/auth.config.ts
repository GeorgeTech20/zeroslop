// Patrón oficial Convex + Clerk. CLERK_JWT_ISSUER_DOMAIN es una env var del
// DEPLOYMENT de Convex (se setea con `npx convex env set`, no va en
// .env.local del Next.js), y "convex" tiene que ser el nombre EXACTO de un
// JWT template creado a mano en el dashboard de Clerk — paso manual del
// dueño, documentado en backend/CONVEX-SETUP.md, sección "Clerk + Convex".
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
