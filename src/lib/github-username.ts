// Reglas y helpers del ÚNICO dato que pide el onboarding: el usuario de
// GitHub. La regex espeja EXACTAMENTE convex/users.ts (GITHUB_USERNAME_REGEX)
// — alfanumérico, guiones simples, no consecutivos, no al borde, máx 39
// caracteres — así el paso 1 valida en vivo lo mismo que va a validar el
// backend, sin round-trip para el caso más común (formato inválido).

export const GITHUB_USERNAME_REGEX =
  /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

// Sanea lo que se pega/tipea: saca "@", "github.com/" (con o sin protocolo),
// espacios, y cualquier carácter fuera de [A-Za-z0-9-]. No rechaza nada
// mientras se tipea (§2.2 de diseno/onboarding-y-cuenta.md — "sin regañar").
export function sanitizeGithubUsernameInput(raw: string): string {
  return raw
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9-]/g, "");
}

// Los dos errores reales que tira convex/users.ts:linkGithubUsername,
// mapeados a copy que dice qué pasó y cómo arreglarlo (nunca el mensaje
// crudo del servidor). El match es por substring porque en un deployment
// `npx convex dev` el mensaje de un `throw new Error(...)` llega completo
// al cliente (a diferencia de un `convex deploy` de producción, que lo
// redacta) — substring en vez de igualdad exacta lo hace resistente a
// como Convex decida envolver el texto.
export function friendlyLinkError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("ya está vinculado")) {
    return "Ese usuario de GitHub ya está vinculado a otra cuenta. Si es tuyo, iniciá sesión con esa cuenta; si no, probá con otro usuario.";
  }
  if (message.includes("inválido")) {
    return "Ese no es un usuario de GitHub válido: letras, números y guiones simples, sin empezar ni terminar en guion.";
  }
  return "No pudimos vincular tu usuario. Probá de nuevo en un momento.";
}

// --- Modo mocks (sin deployment de Convex) ---
// Los dos developers seeded ya existen en el catálogo mockeado
// (src/lib/mock-data.ts) — reusarlos como "usuarios ya tomados" da un
// error real y demostrable sin inventar datos nuevos.
const MOCK_TAKEN_USERNAMES = ["mariafernandez", "luisrivera"];

export async function mockLinkGithubUsername(
  githubUsername: string
): Promise<{ githubUsername: string }> {
  if (!GITHUB_USERNAME_REGEX.test(githubUsername)) {
    throw new Error(
      "Usuario de GitHub inválido: letras, números y guiones simples, máximo 39 caracteres."
    );
  }
  if (MOCK_TAKEN_USERNAMES.includes(githubUsername.toLowerCase())) {
    throw new Error(
      `El usuario de GitHub "${githubUsername}" ya está vinculado a otra cuenta.`
    );
  }
  // Sensación de red — el mismo pequeño delay que tendría el round-trip
  // real a Convex, para que el estado "submitting" del botón se note.
  await new Promise((resolve) => setTimeout(resolve, 260));
  return { githubUsername };
}
