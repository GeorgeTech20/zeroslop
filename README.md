# ZeroSlop

**Comprensión demostrada, antes de que exista la PR.**

ZeroSlop evalúa si quien abre un pull request entiende su propio cambio. No revisa
el código: interroga a la persona. Una pregunta conceptual sobre una decisión real
del diff, y una **mutación hipotética** —un patch que no está en el diff y que
rompería algo importante— para ver si detecta por qué es peligrosa.

Las dos se responden en la terminal, antes de que la PR exista. Se puntúan de 0 a
10 y el resultado queda en un panel de equipo con recursos de aprendizaje elegidos
según lo que falló.

No detecta "código escrito por IA". Usar IA está bien. Lo que se mide es si quien
firma el cambio lo entiende.

> **The Next Craft** · Track: Learning by Shipping

## Cómo funciona

```
El developer pide crear la PR
   ↓
La Skill lee el diff y genera —sin mostrarlas— una pregunta conceptual,
una mutación hipotética y la rúbrica de ambas
   ↓
Le pregunta. La mutación se muestra como patch: nunca toca un archivo real
   ↓
Puntúa: comprensión de decisiones · detección de riesgos · calidad de explicación
   ↓
Recién ahora crea la PR. Un score bajo nunca bloquea
   ↓
Guarda en Convex y entrega la URL del panel  →  n8n avisa al senior por Telegram
```

La evaluación corre en la terminal como **Skill** de Claude Code, y escribe en la
base a través de un **servidor MCP** con sus tools. Por eso ve el diff real y no
una copia.

## Stack

| Tecnología | Para qué |
|---|---|
| **Convex** | Base de datos y functions reactivas: el panel se actualiza solo cuando llega una evaluación |
| **Clerk** | Autenticación, con identidad verificada dentro de Convex vía JWT |
| **n8n** | Notificación al senior por Telegram |
| **Claude Code · Skill + MCP** | La evaluación en la terminal del developer y sus tools contra la base |
| **Next.js 16 · TypeScript** | App Router, server components y suscripciones en vivo |
| **Base UI · Motion** | UI accesible y la animación del panel |

## Correr el proyecto

```bash
pnpm install
npx convex dev            # login, deployment y codegen
npx convex run seed:run   # datos de la demo
pnpm dev                  # http://localhost:3000
```

Variables: copiar `.env.example` a `.env.local` y completar las claves de Clerk.
`npx convex dev` escribe las de Convex solo. Los dos pasos extra para que Convex
acepte la identidad de Clerk están en [`docs/CONVEX-SETUP.md`](docs/CONVEX-SETUP.md) §7.

## Estructura

```
convex/            schema, queries, mutations y seed
src/app/           landing, panel, onboarding, settings, auth
src/components/    UI del panel y del onboarding
src/lib/           capa de datos, tipos, tokens de movimiento
docs/              design system, setup de Convex, esquema unificado
.claude/skills/    la Skill que corre en la terminal
```
