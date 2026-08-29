# ZeroSlop — Dirección visual: onboarding, cuenta y sesión (Fase 4)

Compañero de `design-system.md` + `tokens.css`. **No inventa lenguaje
visual nuevo**: reusa el mismo sistema (panel de instrumentación, señal
lima única, sin semáforo, foco Iris siempre visible). Lo único que se
agregó a `tokens.css` son tres *washes* de revelación y dos ritmos de
animación (ver §0). Esto dirige la UI; `frontend-dashboard` la construye,
`auth-clerk` enchufa Clerk. **No es código de app.**

Superficies que cubre:
1. `/onboarding` — 3 pasos, una idea por pantalla.
2. `/settings` — cuenta (sobria).
3. Header (sign in / sign up / avatar) + `/sign-in` + `/sign-up` con
   `appearance` de Clerk sobre nuestros tokens.

Regla rectora de Fase 4, heredada del producto: **el momento ajá vive en
la terminal, no en la web.** Toda la web es una rampa hacia la terminal y
un lugar donde el resultado (el score) aterriza. El onboarding no enseña:
**revela** (el mismo verbo que el readout del score).

---

## 0. Tokens nuevos (ya escritos en `tokens.css`)

Se agregaron porque las superficies de onboarding tienen una necesidad que
la pantalla única no tenía: **contrastar lo que el usuario escribió contra
lo que se esperaba**, y **mostrar un estado vivo de espera**. Nada de esto
se resolvía con los tokens existentes sin abusarlos.

| Token | Valor | Para qué |
|-------|-------|----------|
| `--color-wash-signal` | `color-mix(voltio 14% + surface-1)` | Fondo de la tarjeta "evidencia esperada" (test 30s) y del chip de URL en vivo cuando es válido. |
| `--color-wash-iris` | `color-mix(iris 12% + surface-1)` | Anotación del eje comprensión; realce del campo activo del paso 1. |
| `--color-wash-ambar` | `color-mix(ámbar 14% + surface-1)` | Aviso suave (usuario aún sin vincular, evaluación aún sin llegar). Nunca "error rojo". |
| `--dur-arrive` | `560ms` | 2º momento hero: transición "esperando → llegó" del paso 3. |
| `--dur-breath` | `1600ms` | Ciclo ambiental (respiración) del estado "esperando". Loop; `reduced-motion` lo apaga por completo. |

Los washes usan `color-mix` contra `--color-surface-1`, así se resuelven
**solos por tema** (tiñen sobre panel oscuro en dark, sobre blanco en
light) sin duplicar definiciones. Contraste: el texto va siempre en
`--color-text` sobre el wash (que es ~86% superficie), así que se mantiene
el mismo ratio AAA/AA del cuerpo — el tinte es ambiente, no fondo de texto
de bajo contraste.

**Prohibiciones que siguen en pie:** crema `#F4F1EA` + terracota `#D97757`
(descartado), semáforo rojo/verde (el copy-OK y el "llegó" se marcan con
**lima + check**, jamás con verde-vs-rojo), y ninguna información
transmitida *solo* por color o *solo* por movimiento.

---

## 1. Contenedor común del onboarding

`/onboarding` no es el dashboard: es una **columna centrada**, no el layout
de dos columnas. Una idea por pantalla ⇒ una tarjeta grande por paso, no un
formulario largo.

```
┌───────────────────────────────────────────────┐
│  header (wordmark + avatar Clerk)              │  ← mismo SiteHeader
├───────────────────────────────────────────────┤
│                                                │
│         ●━━━━━○────────○     (stepper)         │  ← progreso, 3 nodos
│                                                │
│        PASO 1 · TU USUARIO DE GITHUB           │  ← --fs-label, Bruma
│        ┌─────────────────────────────────┐     │
│        │                                 │     │
│        │   una sola idea, aire alrededor │     │  ← tarjeta paso
│        │                                 │     │
│        └─────────────────────────────────┘     │
│                                                │
│              [ Continuar ]     Paso 1 de 3     │
└───────────────────────────────────────────────┘
```

- **Ancho de columna:** `min(560px, 100% − 2·--space-6)`. Centrada
  verticalmente en viewport alto, con `--space-8` de aire arriba/abajo.
- **Tarjeta:** `--color-surface-1`, `1px solid --color-border`,
  `--radius-lg`, padding `--space-8`. La misma tarjeta física en los 3
  pasos: **lo que cambia adentro es el contenido, el marco es constante** —
  refuerza "una idea por vez".
- **Eyebrow del paso:** `--fs-label` (11px, +0.08em, UPPERCASE, Bruma),
  formato `PASO N · TÍTULO`. Es el ancla de "dónde estoy".
- **Título del paso:** `--fs-display` (Space Grotesk 500). Una frase.
- **Subtítulo:** `--fs-body`, `--color-text-muted`, máx. 2 líneas.

### 1.1 Stepper (indicador de progreso)

Tres nodos unidos por una línea. **Codifica estado por forma + relleno, no
por matiz** (misma doctrina que el score):

| Estado | Nodo | Conector entrante |
|--------|------|-------------------|
| Completado | disco lleno `--brand-voltio` + check | línea llena Voltio |
| Actual | anillo `2px --color-interactive` (Iris), centro hueco, **respira** (`--dur-breath`) | — |
| Pendiente | disco hueco `1px --color-border` | línea `--color-border` |

- El nodo actual respira con un halo Iris muy sutil
  (`box-shadow` que crece/decrece, `--dur-breath`, loop). Con
  `reduced-motion`: halo fijo, sin loop.
- **Los tres data points de activación se mapean 1:1 a los tres nodos**
  (vinculó GitHub → instaló Skill → corrió evaluación). El stepper *es* el
  medidor de activación, no un adorno. Cuando el paso 3 se resuelve, el
  nodo 3 hace el flip a lleno-lima justo antes de la transición al panel.
- Accesible: `<ol>` con `aria-current="step"` en el actual; cada nodo lleva
  texto ("Paso 2, actual") no solo color.
- El paso completado es **navegable hacia atrás** (volver al paso 1 a
  corregir el usuario) pero no hacia adelante salteando trabajo.

### 1.2 Navegación entre pasos (Motion)

Reusa el vocabulario del panel derecho del dashboard: contenido *keyed* por
paso dentro de `AnimatePresence`.

- Avanzar: saliente `fade + translateX −16px`, entrante `fade + translateX
  +16px`, `--dur-panel` (220ms), `--ease-standard`. Direccional: se siente
  "adelante".
- Retroceder: espejo (signos invertidos).
- La barra del stepper que se llena entre nodos anima su `scaleX` 0→1 con
  `--ease-standard`, `--dur-select`.
- `reduced-motion`: sin translate; solo el fade de opacidad `--dur-fast`.
  El stepper salta a su estado final.

---

## 2. Paso 1 — Tu usuario de GitHub (la llave)

**Una idea:** este es el único dato de todo el onboarding. Es la llave que
une lo que pasa en la terminal con el panel. Por eso ocupa una pantalla
entera para un solo input.

### 2.1 Anatomía

```
PASO 1 · TU USUARIO DE GITHUB

Con esto te encontramos.
Es lo único que te vamos a pedir.

  github.com/                          ┐
  ┌──────────────────────────────┐     │ input con prefijo fijo
  │ octocat                      │     │ mono, cursor lima
  └──────────────────────────────┘     ┘

  Tu panel va a vivir en:
  ┌──────────────────────────────────────────┐
  │ zeroslop.app/developers/octocat       ↗  │  ← chip URL EN VIVO
  └──────────────────────────────────────────┘

              [ Continuar → ]
```

### 2.2 El input

- **Prefijo fijo `github.com/`** en `--color-text-muted`, dentro del mismo
  marco del campo, no editable. Deja claro *qué* estás tipeando sin repetir
  la palabra "usuario".
- Texto que se escribe: `--font-mono` (es un handle, no prosa),
  `--color-text`, caret lima (`caret-color: var(--brand-voltio)`) — un guiño
  de "terminal" ya desde acá.
- Campo activo: borde `--color-interactive` (Iris) + un lavado
  `--color-wash-iris` de fondo mientras tiene foco. Foco de teclado:
  el `:focus-visible` global (ring Iris, offset 2px) aplica igual.
- Validación **en vivo, sin regañar**: sanea a `[A-Za-z0-9-]`, colapsa
  espacios, saca `@` y `github.com/` si los pega. Nada de error rojo
  mientras tipea. Si queda vacío al intentar continuar: borde
  `--color-wash-ambar` + mensaje ámbar ("Necesitamos tu usuario para
  armar tu panel"), nunca rojo.

### 2.3 El gancho — la URL en vivo (revelar la consecuencia del dato)

Debajo del input, un **chip de URL que se construye letra a letra** con lo
que tipea. Esto es lo audaz del paso 1: *ver la consecuencia del dato
mientras lo escribís*.

- Estructura: `zeroslop.app/developers/` en `--color-text-muted` +
  **`{usuario}` en `--color-signal`/Voltio** (en dark; en light el segmento
  va en `--color-interactive` porque Voltio no contrasta sobre Cal — misma
  regla que ya define el sistema para "Voltio como texto").
- Estados del chip:
  - **Vacío:** placeholder tenue `zeroslop.app/developers/tu-usuario`,
    todo en Bruma, chip con borde `dashed --color-border`.
  - **Escribiendo:** el segmento del usuario aparece con un micro
    `fade+blur→nítido` por carácter (Motion, stagger 18ms, `--dur-fast`).
    El chip pasa a fondo `--color-wash-signal` (dark) / `--color-wash-iris`
    (light) y borde sólido. **La URL se "encendió".**
  - Ícono `↗` a la derecha: **inerte durante el onboarding** (la ruta aún
    no tiene data), con `title="Va a estar disponible cuando corras tu
    primera evaluación"`. No es un link muerto que frustra: es una promesa.
- `reduced-motion`: el segmento aparece de una, sin blur ni stagger; el
  cambio de fondo del chip es el fade `--dur-fast`.

**Por qué funciona:** el dato deja de ser burocracia ("llená el campo") y
se vuelve causa→efecto visible ("esto crea *mi* lugar"). Es el mismo
principio del readout: no se afirma un número, se lo revela formándose.

- CTA **Continuar** (`.primaryBtn`, lima): habilitado sólo con handle no
  vacío y saneado. Enter en el input = Continuar.

---

## 3. Paso 2 — Instalá la Skill (+ el ajá previo)

**Una idea:** llevar la Skill a su repo. Dos bloques, en orden de
lectura: primero **el comando** (la acción real), después **la prueba de
30s** (la razón para hacerlo). El comando arriba porque es el trabajo; la
prueba abajo porque es el gancho que lo empuja a la terminal.

### 3.1 Bloque de comando copiable

```
PASO 2 · INSTALÁ LA SKILL

Pegá esto en tu repo. Se instala como una Skill de Claude Code.

  ┌────────────────────────────────────────────┐
  │ $ …comando de instalación…          [ Copiar ]│  ← bloque mono
  └────────────────────────────────────────────┘
     una línea · monoespaciada · el $ no se copia
```

- Superficie: **pozo mono**, mismo lenguaje que `MutationPatch.pre`
  (`--color-surface-2`, `1px --color-border`, `--radius-md`,
  `--font-mono`/`--fs-mono`). Consistencia: todo lo que es "código para la
  terminal" se ve igual en todo el producto.
- Prompt `$` como prefijo en `--color-text-muted`, **no seleccionable**
  (`user-select: none`) para que copiar traiga solo el comando.
- **Botón Copiar** (dentro del pozo, arriba a la derecha):
  - Reposo: `.ghostBtn` chico, ícono de clip + "Copiar".
  - **Feedback al copiar:** el botón se vuelve check + "Copiado", fondo
    `--color-wash-signal`, ícono `--brand-voltio`, por ~1.4s y vuelve.
    **Lima + check, nunca verde.** Además el borde del pozo hace un flash
    lima de `--dur-fast` (una vez). Confirmación por forma (check) *y*
    color, no solo color.
  - `aria-live="polite"` anuncia "Comando copiado".
  - Teclado: el botón es foco-visible normal; también `Ctrl/Cmd+C` con el
    bloque enfocado copia.
- Debajo, micro-nota `--fs-small` Bruma: "¿Sin Claude Code? [Cómo
  instalarlo ↗]" — link `--color-interactive`.

### 3.2 El ajá previo — prueba de 30 segundos (revelar, no puntuar)

Este es el corazón del paso 2 y el lugar donde gastamos audacia en
onboarding. **Honestidad primero:** no hay LLM en la web, así que **no se
puntúa** — se **revela** lo que la rúbrica esperaba. El gancho es el
contraste entre lo que el usuario escribió y esa expectativa.

Estados de la sub-tarjeta (dentro del paso 2, debajo del comando, separada
por un divisor `--color-border` y su propio eyebrow `PROBALO EN 30s`):

**Estado A — el reto (mutación hipotética real):**
```
PROBALO EN 30s · esto es lo que va a pasar en tu terminal

Un cambio hipotético. ¿Por qué sería peligroso?

  ┌── diff (mono, mismo estilo MutationPatch) ─────┐
  │   function total(items) {                      │
  │ -   return items.reduce((a,b)=>a+b.price,0)    │
  │ +   return items.reduce((a,b)=>a+b.price)      │  ← se quitó el seed 0
  │   }                                            │
  └────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────┐
  │ escribí por qué…                            │  ← textarea, mono
  └────────────────────────────────────────────┘
                            [ Ver qué esperaba la rúbrica ]
```
- El diff reusa **exactamente** `MutationPatch`: `+`/`-` diferenciados por
  **peso y prefijo, no por rojo/verde** (así ya está construido). Coherencia
  total con el detalle del dashboard.
- Textarea en `--font-mono` (está escribiendo sobre código), min 3 líneas,
  autosize. Placeholder honesto: "escribí por qué… (no se guarda, no se
  puntúa)".
- CTA **secundario** `.ghostBtn` ("Ver qué esperaba la rúbrica"),
  habilitado sólo con ≥ ~15 caracteres escritos — **te obliga a intentar
  antes de revelar** (si no, no hay contraste, no hay ajá).

**Estado B — la revelación (el contraste honesto):**
```
  TU RESPUESTA
  ┌────────────────────────────────────────────┐
  │ “lo que el usuario escribió, tal cual”      │  ← surface-2, neutro
  └────────────────────────────────────────────┘

  LO QUE LA RÚBRICA BUSCABA          ┌ comprensión ─ riesgos ┐
  ┌────────────────────────────────────────────┐
  │ • deteccionRiesgos: sin seed, reduce()      │  ← --color-wash-signal
  │   tira TypeError con lista vacía            │
  │ • comprensionDecisiones: el 0 no es cosmé-  │  ← chips de eje
  │   tico, es el caso base                     │
  └────────────────────────────────────────────┘

  Esto es lo que ZeroSlop mide en cada PR.   [ Entendido, seguir → ]
```
- **Dos tarjetas apiladas**, deliberadamente distintas:
  - "TU RESPUESTA": `--color-surface-2`, neutra, sin adorno. Es *tu* voz.
  - "LO QUE LA RÚBRICA BUSCABA": `--color-wash-signal`, con los **chips de
    eje** del sistema (`comprensión` = Iris, `riesgos` = Voltio) marcando a
    qué métrica pertenece cada punto esperado. Es *el instrumento*.
- **El contraste ES el mensaje.** No decimos "te equivocaste": mostramos lo
  neutro (vos) al lado de lo señalado (la rúbrica). El usuario saca su
  propia conclusión — ese es el ajá honesto.
- Los dos ejes que aparecen son los reales del producto
  (`comprensionDecisiones`, `deteccionRiesgos`), no inventados. Prepara el
  ojo para el readout del dashboard: cuando vea su score real, ya reconoce
  las dos barras.
- Motion: la tarjeta de revelación entra con `fade + translateY 8px`,
  `--dur-panel`; los dos bullets escalonan 60ms (mismo patrón que los
  meters del readout). `reduced-motion`: fade `--dur-fast`, sin stagger.
- **No hay número, no hay barra que se llena a un valor.** Fingir un score
  sin LLM sería deshonesto y rompería la promesa del producto. Solo se
  revela texto esperado. La sub-tarjeta se marca "completada" (check lima
  chico junto al eyebrow) pero **no es requisito para avanzar** — el
  requisito del paso 2 es haber copiado el comando; la prueba es el
  incentivo, no un peaje.

CTA principal del paso: **Continuar** (lima). Idealmente se "enciende" (de
ghost a lima) una vez que copió el comando — el sistema premia la acción
real, no el scroll.

---

## 4. Paso 3 — Corré tu primera evaluación (2º momento hero)

**Una idea:** el paso no se completa con un botón. Se completa porque hizo
el trabajo en la terminal. La pantalla **espera viva**, suscrita a Convex,
y cuando llega la primera evaluación de ese `githubUsername`, **cambia
sola** y lo lleva a su panel. Es el segundo hero del producto, después del
readout del score.

### 4.1 Estado "esperando" (vivo, no spinner)

```
PASO 3 · CORRÉ TU PRIMERA EVALUACIÓN

Andá a tu repo y abrí una PR (o corré la Skill).
Cuando termines, esta pantalla se actualiza sola.

        ┌───────────────────────────────┐
        │                               │
        │        ◟ pulso lima ◞          │   ← nodo "vivo" respirando
        │      escuchando a octocat      │
        │                               │
        └───────────────────────────────┘
        Esperando tu primera evaluación…      ← --color-text-muted

  Mientras tanto:                             ← checklist recordatorio
   ✓ Vinculaste tu usuario (octocat)
   ✓ Instalaste la Skill
   ○ Primera evaluación                       ← este nodo respira
```

- **NO es un spinner genérico.** Es un **nodo de instrumento escuchando**:
  un punto lima dentro de un anillo `--color-readout-track` sobre un marco
  `--color-wash-signal`. El punto respira (`box-shadow` lima que crece y
  decrece, `--dur-breath`, loop infinito) — la misma metáfora "señal viva
  de osciloscopio" del sistema, ahora en modo *idle/armado*.
- Texto de estado con `aria-live="polite"`: "Esperando la primera
  evaluación de octocat". La espera se anuncia; no es solo una animación.
- **El eco del handle:** "escuchando a **octocat**" cierra el loop abierto
  en el paso 1 (el dato que tipeó ahora es lo que el sistema está
  esperando). Refuerza que la llave era real.
- Mini-checklist de los **3 data points de activación** como cierre: los
  dos primeros con check lima, el tercero como nodo que respira. El usuario
  ve exactamente qué falta y que ya hizo 2 de 3.
- La conexión a Convex puede fallar/reconectar: si se cae la suscripción,
  el marco pasa a `--color-wash-ambar` y el texto dice "Reconectando…"
  (ámbar, nunca rojo). Vuelve a lima al reconectar.
- `reduced-motion`: **sin respiración**. El nodo queda fijo (lima estable) y
  la espera se comunica solo por el texto `aria-live`. Ninguna info vive
  solo en el pulso.

### 4.2 La llegada (`--dur-arrive`) — 2º momento hero

Cuando la suscripción de Convex emite la primera evaluación del usuario, la
transición es una **secuencia corta y satisfactoria**, no un salto:

1. **t=0 — el nodo "engancha".** El pulso ambiental se detiene y el punto
   lima da un único destello nítido (scale 1→1.15→1, `--dur-fast`) + la
   línea de escaneo lima barre el marco una vez (reusa la "línea de
   escaneo" del readout, §5.2 del design-system). "Señal adquirida."
2. **t≈160ms — el nodo 3 del stepper hace flip a lleno-lima** con su check.
   Activación completa: 3/3.
3. **t≈220ms — el marco de espera se transforma en una mini-preview del
   readout:** aparece el dígito del `overallScore` contando `0.0 → score`
   dentro de un pozo `--readout-well` (el mismo `ScoreReadout`, en chico).
   El usuario ve *su* número real por primera vez — el WIN del onboarding.
4. **t≈220–780ms (`--dur-arrive`) — hand-off al panel.** La mini-preview
   crece/funde hacia `/developers/octocat`. Usar `layout`/shared-element de
   Motion si el pozo puede compartir `layoutId` con el readout del
   dashboard; si no, `fade + scale 0.98→1` sobre `--dur-arrive`. Redirección
   real a la ruta al terminar.
- Copy del instante: "Llegó tu primera evaluación." → (al aterrizar) el
  panel del equipo con **octocat ya en la tabla, su fila destacada**.
- **Este es el WIN visible:** primera evaluación guardada + score en el
  panel del equipo. El onboarding no termina en una pantalla de "listo":
  termina *soltándolo dentro del producto ya poblado con su dato*.
- `reduced-motion`: sin escaneo, sin conteo, sin scale. Un `fade`
  `--dur-fast` del marco de espera al panel; el score aparece en su valor
  final. Se redirige igual. La llegada se **anuncia** por `aria-live`
  ("Llegó tu primera evaluación, abriendo tu panel").

> Nota para `frontend-dashboard`: el paso 3 **no tiene CTA de avance**. El
> único "botón" es un escape hatch secundario `--fs-small` Bruma: "Saltar y
> ver el panel vacío" (por si el jurado quiere mirar sin correr nada). No
> compite visualmente con la espera.

---

## 5. `/settings` — cuenta (sobria, no luce)

Contra-punto deliberado del onboarding: **acá no hay hero, no hay pulso, no
hay lima de celebración.** Es mantenimiento. Layout de **una columna de
secciones apiladas** (no el grid de dos columnas del dashboard), mismo
ancho centrado que el onboarding (`min(560px, …)`).

Tres secciones, cada una una tarjeta `--color-surface-1` /
`1px --color-border` / `--radius-lg`, con eyebrow `--fs-label` Bruma:

**1 · USUARIO DE GITHUB**
```
Vinculado a
  github.com/octocat                         [ Cambiar ]
  Tu panel: zeroslop.app/developers/octocat  ↗   ← acá el ↗ SÍ es link vivo
```
- Muestra el handle vinculado en `--font-mono`. "Cambiar" (`.ghostBtn`)
  abre el **mismo input del paso 1 inline** (con su URL en vivo), no una
  pantalla nueva — reuso literal del patrón. Confirmar = check lima breve.
- Advertencia honesta al cambiar, en `--color-wash-ambar` (no rojo):
  "Cambiar tu usuario mueve tu panel a otra URL. Tus evaluaciones viejas
  quedan bajo el usuario anterior." Es consecuencia real, se avisa sin
  dramatizar.
- El link al panel acá **sí está vivo** (ícono `↗` interactivo,
  `--color-interactive`) — contraste intencional con el `↗` inerte del
  onboarding.

**2 · CUENTA (Clerk)**
- Monta el `<UserProfile />` de Clerk con nuestro `appearance` (§6). Email,
  contraseña, sesiones, cerrar sesión — todo lo maneja Clerk. **No lo
  reconstruimos**, solo lo vestimos. Encajado en la tarjeta para que no
  parezca un widget ajeno.

**3 · TU PANEL**
- Un solo botón `.primaryBtn` lima: "Abrir mi panel →" a
  `/developers/{usuario}`. Es la única nota de color de la pantalla —
  settings es gris y sobrio a propósito, y el único brillo apunta al
  producto.

Estados: si el usuario aún no vinculó GitHub (llegó a settings sin
onboarding), la sección 1 muestra un CTA `--color-wash-ambar` "Vinculá tu
usuario para tener panel → " que lleva a `/onboarding`. Nunca error rojo.

---

## 6. Clerk con nuestros tokens — que no parezca pegado de otro producto

Clerk acepta un objeto `appearance` (variables + `elements` por clase).
`auth-clerk` lo aplica; **acá va la especificación de diseño**, mapeada a
tokens ya existentes. Objetivo: que `/sign-in`, `/sign-up`, `<UserButton>`
y `<UserProfile>` se lean como ZeroSlop, no como Clerk default.

### 6.1 `appearance.variables` (mapeo a tokens)

| Variable Clerk | Token ZeroSlop | Nota |
|----------------|----------------|------|
| `colorBackground` | `--color-surface-1` | tarjeta de la card |
| `colorPrimary` | `--brand-voltio` | botón primario = lima |
| `colorText` | `--color-text` | |
| `colorTextSecondary` | `--color-text-muted` | |
| `colorInputBackground` | `--color-bg` | inputs sobre el chasis |
| `colorInputText` | `--color-text` | |
| `colorDanger` | `--color-attention` (Ámbar) | **no rojo** — coherencia dura |
| `colorSuccess` | `--brand-voltio` | **no verde** — señal = lima |
| `colorNeutral` | `--color-text` | |
| `borderRadius` | `--radius-sm` (6px) | mismo radio de botones del header |
| `fontFamily` | `var(--font-body)` | Geist/Inter |
| `fontFamilyButtons` | `var(--font-body)` | |
| `colorShimmer` | `--color-wash-iris` | loaders/skeletons Clerk teñidos Iris |

**Importante:** `colorPrimary` es lima y el texto del botón primario debe ir
en `--brand-grafito` (lima no contrasta con texto claro) — igual que
`.primaryBtn` del header. Setear `colorTextOnPrimaryBackground:
var(--brand-grafito)`.

### 6.2 `appearance.elements` (clases, para lo que las variables no cubren)

- `card`: quitar sombra pesada default; usar `1px solid var(--color-border)`
  + `--radius-lg`, fondo `--color-surface-1`. Que respire igual que
  nuestras tarjetas.
- `headerTitle`: `font-family: var(--font-display)` (Space Grotesk) —
  **este detalle es el que despega del look Clerk.** Los títulos de auth
  hablan con nuestra voz display.
- `formButtonPrimary`: heredar exactamente `.primaryBtn` (lima, grafito,
  `--radius-sm`, hover `brightness(1.06)`). Sin gradiente, sin sombra Clerk.
- `formFieldInput:focus`: `outline: 2px solid var(--color-ring)` +
  `outline-offset: 2px` — **nuestro foco Iris, no el foco default de
  Clerk.** El piso de calidad (foco visible) vale también dentro de Clerk.
- `socialButtonsBlockButton` (GitHub OAuth, si se usa): `.ghostBtn`
  (borde `--color-border-strong`, hover borde Iris).
- `footerActionLink`, `identityPreviewEditButton`:
  `color: var(--color-interactive)`.
- `badge`, `avatarBox`: borde `--color-border`; el avatar del `UserButton`
  toma un anillo `--color-interactive` en `:focus-visible`.
- `dividerLine`: `--color-border`; `dividerText`: `--color-text-muted`,
  `--fs-label`.

### 6.3 Dark mode

Clerk no lee nuestro `[data-theme]`. `auth-clerk` debe construir el objeto
`appearance` **leyendo los mismos tokens en runtime** (o mantener dos
objetos, light/dark, con los hexes que ya están en `tokens.css`) y
cambiarlo cuando cambia el tema. Los valores son los de las columnas
`light`/`dark` de `tokens.css` — no hexes nuevos. Con `prefers-color-scheme`
sin `data-theme`, usar la rama dark.

### 6.4 Header — los tres controles de sesión

Reemplazar el placeholder de `SiteHeader.tsx` (ya hay un comentario-guía
ahí y las clases `.ghostBtn`/`.primaryBtn` listas):

- **Signed out:** `<SignInButton>` → `.ghostBtn` ("Iniciar sesión"),
  `<SignUpButton>` → `.primaryBtn` ("Registrarse"). Ya heredan nuestros
  estilos pasándolos como `className`. En mobile (`max-width: 720px`) el
  `.ghostBtn` se oculta (ya está en el CSS): queda solo "Registrarse".
- **Signed in:** `<UserButton afterSignOutUrl="/">` con `appearance.elements
  .avatarBox` = 28px, anillo `--color-interactive` en foco/hover. El menú
  del avatar toma `card`/`popover` con los mismos tokens (fondo
  `--color-surface-1`, borde `--color-border`, `--radius-md`).
- Agregar al menú del `UserButton` un item custom "Configuración" →
  `/settings` y "Mi panel" → `/developers/{usuario}` (Clerk permite
  `UserButton.Action`/`UserButton.Link`). Así el header es el hub de
  navegación logueado.
- **Contraste del avatar:** el anillo Iris de foco cumple el mismo ≥3:1 de
  UI que el resto (ya verificado en el design-system).

### 6.5 Páginas `/sign-in` y `/sign-up`

- Layout: **columna centrada**, mismo `min(560px,…)`, mismo header arriba,
  fondo `--color-bg`. La `<SignIn/>` / `<SignUp/>` de Clerk montada al
  centro con el `appearance` de §6.1–6.2.
- Un **eyebrow propio** encima de la card de Clerk (fuera del control), para
  dar contexto de marca y que no sea "una card flotando":
  - sign-in: `BIENVENIDO DE VUELTA` (`--fs-label` Bruma).
  - sign-up: `EMPEZÁ A DEMOSTRAR COMPRENSIÓN` (`--fs-label` Bruma).
- Post sign-up → redirigir a `/onboarding` (paso 1). Post sign-in con
  usuario ya onboardeado → `/developers/{usuario}`; sin onboardear →
  `/onboarding`. (Regla de producto para `auth-clerk`; la nombro para que
  el diseño del stepper cierre: quien ya se activó no vuelve a ver el
  onboarding.)
- `reduced-motion`: Clerk respeta el suyo; no agregamos transiciones
  propias en estas rutas más allá del fade de entrada `--dur-fast`.

---

## 7. Piso de calidad (checklist para `frontend-dashboard` y `auth-clerk`)

- [ ] **Foco de teclado visible** en TODO: input del paso 1, botón Copiar,
      textarea del test, escape hatch, inputs de Clerk (override del foco a
      ring Iris), avatar. Nunca `outline:none` sin reemplazo.
- [ ] **Una idea por pantalla:** los 3 pasos son pantallas separadas
      (`AnimatePresence`), no un scroll largo con todo junto.
- [ ] **`prefers-reduced-motion`:** apaga respiración del stepper y del nodo
      de espera, apaga escaneo/conteo/scale de la llegada, apaga blur/stagger
      de la URL en vivo y de la revelación. Todo cae a fade `--dur-fast`.
      Ninguna info (progreso, llegada, validez) vive **solo** en movimiento.
- [ ] **Sin semáforo:** copy-OK, "llegó", pasos completados = **lima +
      check**. Avisos = **ámbar + texto**. Cero rojo/verde.
- [ ] **Responsive hasta mobile:** columna full-width con `--space-5` de
      margen; el pozo del comando y el diff hacen `overflow-x:auto` (ya es
      el patrón de `MutationPatch.pre`); el stepper colapsa a nodos + label
      del paso actual si no entra la línea completa.
- [ ] **Contraste:** todo texto sobre washes usa `--color-text` (los washes
      son ~86% superficie ⇒ mantienen ratio de cuerpo); segmentos Voltio como
      *texto* solo en dark (en light, el segmento de URL va Iris). El botón
      primario lima lleva texto grafito.
- [ ] **`aria-live`** en: feedback de copiar, estado de espera del paso 3,
      la llegada, y errores de vinculación en settings. La UI no es solo
      visual.
- [ ] **Honestidad:** el test de 30s **revela**, no puntúa (no hay LLM en la
      web). No se muestra un número inventado en ningún lado de la web salvo
      el score **real** que llega de Convex en el paso 3 / dashboard.

---

## 8. Handoff

- `frontend-dashboard`: construye `/onboarding` (3 pasos + stepper +
  transiciones), `/settings`, y enchufa el header con los slots de Clerk.
  Reusa `MutationPatch` (diff), `ScoreReadout` (mini-preview de la llegada)
  y `motion-tokens.ts` (agregar `DUR_ARRIVE = 0.56`, `DUR_BREATH = 1.6` como
  espejo de los tokens nuevos).
- `auth-clerk`: aplica el objeto `appearance` de §6, monta `<UserProfile/>`
  en settings, resuelve los redirects post-auth de §6.5, y overridea el foco
  de los inputs de Clerk al ring Iris.
- Fuente de verdad de valores: `tokens.css` (con los 5 tokens nuevos de §0).
  Si algo pide un color que no está, se agrega ahí primero — no se hardcodea
  en componentes.

No emito líneas DELEGAR: el encargo es el documento, y está entregado.
