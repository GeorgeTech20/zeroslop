# Convex — setup real (Fase 2)

Código listo en `desarrollo/zeroslop-app/convex/` (schema + functions +
seed). Nada de esto corrió en esta máquina — no hay `~/.convex` ni
`CONVEX_DEPLOYMENT`, y el login de Convex abre browser, así que estos
pasos los tiene que correr el dueño a mano, en este orden.

## 1. Login + deployment de dev

Desde `desarrollo/zeroslop-app/`:

```bash
npx convex dev
```

- La primera vez pide login por navegador (`npx convex login` si hace
  falta por separado) y después te deja elegir/crear un proyecto Convex.
- Deja el proceso corriendo (watch mode): sincroniza `convex/*.ts`,
  corre codegen (`convex/_generated/`) y crea/actualiza `.env.local` con
  `CONVEX_DEPLOYMENT` y `NEXT_PUBLIC_CONVEX_URL` automáticamente.
- Si en algún punto pide aprobar el build script de `esbuild` (pnpm ya
  lo tiene marcado `true` en `pnpm-workspace.yaml`, pero si `pnpm install`
  lo vuelve a preguntar): `pnpm approve-builds`.
- Cortá con Ctrl+C cuando quieras, y volvé a correr `npx convex dev`
  para seguir sincronizando en la próxima sesión.

## 2. Cargar el seed

Con el `npx convex dev` corriendo (o después de un `npx convex deploy`),
en otra terminal:

```bash
npx convex run seed:run
```

Es idempotente — correrla de nuevo no duplica developers, evaluaciones
ni recursos (chequea `githubUsername`, `githubUsername`+`pullRequestUrl`
y `url` respectivamente antes de insertar). Devuelve
`{ developersInserted, evaluationsInserted, resourcesInserted }`; en la
segunda corrida esos tres quedan en `0`.

## 3. Deploy a producción (para la demo, cuando corresponda)

```bash
npx convex deploy
```

Genera un deployment de prod separado del de dev. Si lo usás para la
demo, corré el seed también contra prod:

```bash
npx convex run seed:run --prod
```

## 4. Conectar el MCP oficial de Convex a Claude Code

El servidor MCP lo trae el propio paquete `convex` (ya está instalado en
`desarrollo/zeroslop-app/package.json`), no hay que instalar nada nuevo.
Comando de arranque del servidor:

```bash
npx -y convex@latest mcp start
```

Para que Claude Code lo levante solo, registralo como servidor MCP local
(desde `desarrollo/zeroslop-app/`, para que tome el proyecto correcto vía
`--project-dir` implícito):

```bash
claude mcp add convex -- npx -y convex@latest mcp start
```

Esto necesita que ya hayas hecho `npx convex login` (paso 1) — el MCP
server reusa esas credenciales globales. Trae varios tools (`status`,
`tables`, `data`, `functionSpec`, `run`, `logs`, `envList`/`envGet`/
`envSet`/`envRemove`, `insights`); el que usa la Skill
`zeroslop-pr-check` es **`run`**, que ejecuta una function deployada por
nombre + argumentos. Por default apunta al deployment de **dev**; para
producción hace falta `--prod --dangerously-enable-production-deployments`
al registrar el server (no lo actives salvo que la demo lo requiera).

## 5. Contrato exacto que usa la Skill (tool `run` del MCP oficial)

Function: **`evaluations:save`** (mutation).

Argumento (JSON, tal cual lo arma el paso 7 de
`.claude/skills/zeroslop-pr-check/SKILL.md`):

```json
{
  "githubUsername": "octocat",
  "pullRequestUrl": "https://github.com/org/repo/pull/123",
  "conceptualQuestion": "¿Por qué...?",
  "conceptualAnswer": "texto de la respuesta del developer",
  "conceptualScore": 8,
  "mutationDescription": "Patch hipotético: ...\n\n```diff\n...\n```",
  "mutationAnswer": "texto de la respuesta del developer",
  "mutationScore": 7,
  "explanationQuality": 7.5,
  "overallScore": 7.5
}
```

Notas de mapeo (la Skill calcula `comprensionDecisiones`/
`deteccionRiesgos`/`calidadExplicacion` en su paso 5, pero al llamar a
Convex esos valores van en los campos de arriba):
`conceptualScore = comprensionDecisiones`,
`mutationScore = deteccionRiesgos`,
`explanationQuality = calidadExplicacion`,
`overallScore = avg(comprensionDecisiones, deteccionRiesgos)`. No mandes
`createdAt` — lo pone el server (`Date.now()`).

Devuelve: `{ "githubUsername": "octocat" }`. Con eso arma la Skill (paso
8) la URL `/developers/octocat`.

Para leer el perfil o la tabla del equipo (las usa el frontend, no la
Skill, pero por si hace falta probar a mano con el MCP):

```
run developers:getProfile { "githubUsername": "octocat" }
run developers:listTeamTable {}
```

## 6. Variable de entorno para el frontend

`npx convex dev` / `npx convex deploy` escriben
`NEXT_PUBLIC_CONVEX_URL` en `desarrollo/zeroslop-app/.env.local`
automáticamente (junto con `CONVEX_DEPLOYMENT`). `.env.local` ya está
en `.gitignore` (vía el patrón `.env*`), no hace falta tocarlo a mano.

El frontend todavía NO lee esta variable — hoy sigue importando
`src/lib/mock-data.ts` directo. Cablear un `ConvexReactClient` con
`process.env.NEXT_PUBLIC_CONVEX_URL` (fallback a los mocks si no está
seteada) es el próximo encargo de `frontend-dashboard`, no de esta fase.

## 7. Fase 4 — tabla `users` y auth con Clerk

Código listo en `desarrollo/zeroslop-app/convex/users.ts`,
`convex/schema.ts` (tabla `users` agregada) y `convex/auth.config.ts`.
Igual que el resto: nada de esto corrió contra un deployment real todavía.

### 7.1 Modelo

`users` es la cuenta web (Clerk) y es tabla **distinta** de `developers`
(que sigue siendo "alguien con evaluaciones", la crea la Skill sin auth).
El puente entre ambas es `githubUsername`, que en `users` es **opcional**
porque recién se completa cuando el usuario termina el onboarding. Un
developer puede existir sin user (los 2 seeded de la demo) y viceversa
(alguien recién logueado que no vinculó github todavía).

Índices: `by_clerk_user` (buscar el user de la sesión activa) y
`by_github_username` (chequear duplicados al vincular, y para que
`onboardingStatus` encuentre la primera evaluación).

### 7.2 Functions (`convex/users.ts`)

- `users.me` — query, sin argumentos. Identidad sale de
  `ctx.auth.getUserIdentity()`, nunca de un argumento (sería spoofeable).
  Devuelve el user o `null` si `ensure` todavía no corrió.
- `users.ensure` — mutation idempotente. La llama el frontend apenas hay
  sesión de Clerk activa (p. ej. al entrar al layout autenticado). Si el
  user ya existe no lo toca; si no, lo crea con lo que traiga la identidad
  de Clerk (`name`, `email`).
- `users.linkGithubUsername` — mutation, input `{ githubUsername }`. Valida
  formato real de GitHub (alfanumérico + guiones simples, máx 39
  caracteres) y que ningún otro user ya lo tenga (si está tomado, error
  claro — no lo pisa). Marca `onboardingCompletedAt`.
- `users.onboardingStatus` — query, sin argumentos. Devuelve los 3 data
  points de activación: `hasAccount`, `hasGithubUsername`,
  `hasFirstEvaluation`. Este último es el paso clave del producto: como es
  una query reactiva de Convex, cuando la Skill corre `evaluations.save`
  desde la terminal, la pantalla de onboarding lo ve en vivo por
  websocket — **no hay botón "Siguiente" para ese paso**, se completa solo.

`evaluations.save` **no cambió**: la sigue llamando la Skill desde la
terminal vía el MCP oficial, sin sesión de Clerk, y sigue sin requerir
identidad. No confundir con `users.*`, que sí la exige.

Tipos de estas 4 functions en `convex/types.ts` (`User`, `EnsureUserResult`,
`OnboardingStatus`, etc.) — mismo patrón que Fase 2: `frontend-dashboard` /
`auth-clerk` tienen que mirrorearlos a mano en `src/lib/types.ts` (no se
tocó `src/` en este encargo).

### 7.3 Paso manual del dueño: JWT template de Clerk

`convex/auth.config.ts` necesita un JWT template en Clerk llamado
**exactamente `convex`** (así está hardcodeado el `applicationID`) y la env
var `CLERK_JWT_ISSUER_DOMAIN` seteada en el **deployment de Convex** (no en
`.env.local` de Next.js). Ninguna de las dos las puede crear un agente.

1. Dashboard de Clerk → **JWT templates** → **New template** → elegí
   **Convex** en la lista de templates predefinidos (o creá uno en blanco y
   nombralo `convex` a mano si no aparece la opción predefinida). El nombre
   del template tiene que quedar `convex`, sin importar cuál elijas.
2. En el template ya creado, copiá el **Issuer** (es la misma URL que
   figura como **Frontend API URL** en Clerk Dashboard → **API keys**).
   Tiene forma `https://<algo>.clerk.accounts.dev` (dev) o tu dominio
   custom en prod.
3. Seteala como env var del deployment de Convex (desde
   `desarrollo/zeroslop-app/`, con `npx convex dev` ya corrido al menos una
   vez para tener deployment):

   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<tu-issuer>.clerk.accounts.dev
   ```

   Para producción, repetir con `--prod` apuntando al issuer que corresponda
   a las claves de Clerk de prod (si son distintas de las de dev).
4. No hace falta tocar `.env.local` del Next.js para este paso — Clerk del
   lado del cliente ya está resuelto por `auth-clerk` con
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`, que son
   variables aparte.

Sin este paso, `ctx.auth.getUserIdentity()` devuelve `null` siempre
(las queries de `users.*` se comportan como si nadie estuviera logueado),
aunque el usuario tenga sesión de Clerk en el browser.
