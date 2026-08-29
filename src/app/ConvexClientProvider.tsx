"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo, type ReactNode } from "react";

// Sin NEXT_PUBLIC_CONVEX_URL no hay deployment (ver backend/CONVEX-SETUP.md):
// se salta el provider y se renderiza el árbol tal cual, que en ese caso
// viene armado con mocks server-side (ver src/lib/data-source.ts) y nunca
// llama a usePreloadedQuery/useQuery. Este componente sigue siendo "use
// client" y llamando a useAuth() incondicionalmente (regla de los hooks),
// pero ClerkProvider ya envuelve este árbol (ver layout.tsx) así que
// useAuth() nunca explota, con o sin Convex configurado.
//
// Con NEXT_PUBLIC_CONVEX_URL seteada, ConvexProviderWithClerk es el patrón
// oficial Convex+Clerk: usa el useAuth de Clerk para pedir el JWT (con el
// template "convex", ver convex/auth.config.ts) y lo adjunta a cada query,
// así ctx.auth.getUserIdentity() en las functions de convex/users.ts
// recibe la identidad real en vez de null.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const client = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [convexUrl]
  );

  if (!client) return <>{children}</>;
  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
