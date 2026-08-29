---
name: zeroslop-pr-check
description: Use when the developer asks to create a pull request with their changes (e.g. "create a PR", "crea la PR", "push and open a PR", "abrí el PR con estos cambios"). Evaluates whether the developer understands their own change before the PR is created, scores their understanding, and saves the result to Convex via the official Convex MCP server. Do not use for PRs that don't involve a code diff, or when the developer explicitly asks to skip the check.
---

# ZeroSlop — PR understanding check

Esto corre en la MISMA sesión del developer, no como subagente aparte
— por eso es una Skill y no un agente en `.claude/agents/`. Se activa
sola cuando el developer te pide crear una PR.

**Decisión de producto (Ronda 2, confirmada):** nunca modificás el
código fuente real del proyecto. La mutación crítica es un patch
**hipotético**, renderizado en la terminal — el working tree del
developer no se toca.

**Decisión de producto (Ronda 3 Q1, recomendación adoptada — VERIFICAR
si tu otra sesión respondió distinto):** la PR se crea siempre, sin
importar el score. Una puntuación baja nunca bloquea, solo alimenta
recomendaciones.

## Pasos exactos

1. **Inspeccioná el diff completo** de lo que se va a subir (`git diff`
   contra la base branch), no solo lo que vos recordás haber generado
   en esta sesión — Ronda 3 Q2: tiene que coincidir con lo que
   realmente va a revisar un humano.

2. **Generá internamente, antes de preguntar nada:**
   - Una pregunta conceptual de alto nivel sobre una decisión real del
     diff (ej. "¿por qué moviste el token a una cookie HttpOnly?")
   - Una mutación crítica hipotética: un cambio que alteraría el
     comportamiento de forma importante y que NO está en el diff real
   - Una rúbrica de evaluación para ambas, con la evidencia que
     esperarías ver en una buena respuesta

   El developer nunca ve la rúbrica ni la evidencia esperada antes de
   responder (Ronda 3 Q3, confirmado).

3. **Mostrá la pregunta conceptual.** Esperá la respuesta del
   developer antes de seguir.

4. **Mostrá la mutación crítica como patch hipotético** renderizado en
   texto/código en la terminal — dejá clarísimo que es hipotético y
   que no se aplicó a ningún archivo real. Preguntá por qué ese cambio
   sería crítico y no debería estar ahí. Esperá la respuesta.

5. **Puntuá ambas respuestas, 0 a 10 cada una**, contra la rúbrica que
   generaste en el paso 2. Calculá:
   - `comprensionDecisiones` = score de la pregunta conceptual
   - `deteccionRiesgos` = score de la pregunta de mutación
   - `calidadExplicacion` = promedio de claridad y precisión mostradas
     en ambas respuestas
   - `overallScore` = promedio de `comprensionDecisiones` y
     `deteccionRiesgos`

   (Ronda 3 Q4, confirmado — no inventes otra fórmula.)

6. **Pusheá la rama y creá la PR** (`gh pr create` o equivalente). Esto
   pasa recién ahora, después de puntuar — no antes.

7. **Guardá el resultado en Convex vía el MCP server oficial de
   Convex** (tool `run`, no un servidor MCP propio — ver
   `.claude/agents/backend-convex.md` para el nombre exacto de la
   function). Mandá: usuario de GitHub, URL de la PR, ambas preguntas
   y respuestas, los 3 scores, y `overallScore`.

8. Convex devuelve el identificador del developer. Entregale al
   developer la URL `/developers/{githubUsername}` del dashboard, y
   opcionalmente el link a la PR en GitHub.

## Qué NO hacer

- No apliques la mutación hipotética a ningún archivo real.
- No muestres la rúbrica ni la evidencia esperada antes de que el
  developer responda.
- No bloquees ni canceles la creación de la PR por un score bajo.
- No inventes un servidor MCP propio para hablar con Convex — usá el
  oficial.
