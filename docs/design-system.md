# ZeroSlop — Sistema visual

Pantalla única: `/developers/[githubUsername]`.
Layout de dos columnas: **tabla del equipo** (izq, angosta) + **detalle
del developer** (der, ancha — el momento hero).

Metáfora rectora: **panel de instrumentación / observabilidad**, no
scoreboard de trivia. El score no "gana" ni "pierde": se *lee* como una
métrica en un readout. Por eso evitamos el semáforo rojo→verde (cliché de
scoreboard) y codificamos el valor por **cantidad de relleno**, no por
matiz. Un solo color de señal (lima) manda; el matiz nunca dice "aprobado
/ reprobado".

Autocrítica aplicada: el default de IA hoy es fondo crema `#F4F1EA` +
acento terracota `#D97757`. **Descartado por regla dura.** También
descartado el semáforo rojo/verde y el degradé arcoíris de gauge. La
paleta es fría-grafito + una señal lima ácida + un contrapunto violeta:
lenguaje de instrumento, no de tarjeta de examen.

---

## 1. Paleta — 6 hex nombrados

| Nombre | Hex | Rol | Justificación (1 línea) |
|--------|-----|-----|-------------------------|
| **Grafito** | `#15171C` | Tinta / base oscura | Casi-negro frío (no negro puro): chasis de instrumento, descansa la vista en sesiones largas. |
| **Cal** | `#F0F2F1` | Papel / base clara | Blanco encalado **frío-neutro**, deliberadamente lejos del crema cálido de IA. |
| **Voltio** | `#C7F82E` | Señal primaria / héroe del score | Lima ácida de terminal/osciloscopio: la energía de "instrumento vivo" sin caer en verde-semáforo. |
| **Iris** | `#7A6CF2` | Interacción / foco / 2ª métrica | Violeta eléctrico: contrapunto frío a la lima, marca lo accionable (foco de teclado, `comprensiónDecisiones`). |
| **Ámbar** | `#F2B237` | Atención / valor bajo | Precaución de instrumento (ámbar de tablero), no "reprobado"; solo indicador, nunca cuerpo de texto. |
| **Bruma** | `#8A93A0` | Texto secundario / mudo | Gris pizarra que separa jerarquía sin introducir otro matiz (se oscurece en modo claro por contraste). |

> **Nota de diseño clave:** el *readout* del score (panel derecho) usa un
> pozo oscuro **`#101216` en AMBOS modos**. Así la lima siempre cae sobre
> grafito y conserva contraste y dramatismo incluso en modo claro. El
> score no es "un número en la página": es una **lectura en una consola
> empotrada**.

Ejes semánticos de las dos métricas que promedian `overallScore`:
- `comprensionDecisiones` → **Iris** (violeta).
- `deteccionRiesgos` → **Voltio** (lima).
- `overallScore` = promedio → se muestra en lima (color de señal dominante).

Neutrales derivados (superficies, bordes) están en `tokens.css`; no son
colores de marca, son elevaciones del chasis.

---

## 2. Tipografía

Trío con carácter, anti-genérico. Fallbacks del sistema entre paréntesis.

| Rol | Familia | Uso |
|-----|---------|-----|
| **Display** | `Space Grotesk` (→ `system-ui`) | Dígito héroe del score, títulos de sección. Sus números tienen carácter geométrico; le da voz al readout. |
| **Body** | `Geist` (→ `Inter`, `system-ui`) | Todo el texto de UI: tabla, labels, prosa del perfil. Limpio pero menos "default" que Inter solo. |
| **Mono** | `JetBrains Mono` (→ `ui-monospace`) | El **patch de la mutación** (diff) y respuestas de código en el detalle; además números tabulares de la tabla. |

### Escala tipográfica (base 16px)

| Token | px / rem | Familia | Peso | Tracking | Uso |
|-------|----------|---------|------|----------|-----|
| `--fs-hero` | 72 / 4.5rem | Display | 500 | −0.03em | Dígito del `overallScore` en el readout |
| `--fs-display` | 32 / 2rem | Display | 500 | −0.02em | Nombre del developer (título del panel) |
| `--fs-title` | 20 / 1.25rem | Display | 500 | −0.01em | Encabezados de sección |
| `--fs-body` | 15 / 0.9375rem | Body | 400 | 0 | Texto general, celdas de tabla |
| `--fs-small` | 13 / 0.8125rem | Body | 400/500 | 0 | Texto secundario, meta |
| `--fs-mono` | 13 / 0.8125rem | Mono | 400 | 0 | Patch de mutación, código |
| `--fs-label` | 11 / 0.6875rem | Body | 600 | +0.08em, UPPERCASE | Labels de meters ("COMPRENSIÓN", "RIESGOS") |

Line-heights: hero `1.0`, display/title `1.15`, body `1.55`, mono `1.6`.
Números de tabla: `font-variant-numeric: tabular-nums` (alineación de
columnas de score).

---

## 3. Escala de espaciado (base 4px)

| Token | px |
|-------|----|
| `--space-1` | 2 |
| `--space-2` | 4 |
| `--space-3` | 8 |
| `--space-4` | 12 |
| `--space-5` | 16 |
| `--space-6` | 24 |
| `--space-7` | 32 |
| `--space-8` | 48 |
| `--space-9` | 64 |

Radios: `--radius-sm 6px`, `--radius-md 10px`, `--radius-lg 16px`,
`--radius-well 20px` (el pozo del readout).
Densidad de tabla: alto de fila 44px, padding horizontal `--space-5`.
Gutter entre columnas: `--space-7`. Grid sugerido: `minmax(280px, 34%) 1fr`.

---

## 4. Estados de foco de teclado

Piso de calidad: foco **siempre visible**, en ambos modos, en todo
elemento interactivo (filas de tabla, tabs, links del patch).

- Token: `--ring` = **Iris** (dark `#7A6CF2` / light `#5B4BD6` para contraste de texto/borde).
- Patrón base: `:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: var(--radius-sm); }`
- **Filas de la tabla**: al recibir foco de teclado, además del ring Iris
  aparece el **indicador lima de 3px** en el borde izquierdo (el mismo que
  marca la fila activa). Foco y selección comparten vocabulario visual.
- Nunca `outline: none` sin reemplazo. El hover es sutil (surface-2); el
  foco es inequívoco (ring). No confundir hover con foco.
- Orden de tabulación: tabla (filas, ↑/↓ mueve selección, Enter/Espacio
  confirma) → tabs del detalle → contenido. La selección por teclado
  dispara la misma transición que el click.

Contraste del ring: Iris sobre Grafito 4.5:1, sobre Cal 3.55:1 — supera el
mínimo 3:1 para componentes de UI (WCAG 1.4.11).

---

## 5. Dirección de animación (Motion)

Presupuesto de audacia gastado en **un solo lugar**: la revelación del
`overallScore` al seleccionar una fila. El resto es sobrio.

### 5.1 Transición de selección de fila
- **Indicador activo compartido** (`layoutId` de Motion): la barra lima del
  borde izquierdo *se desliza* de la fila anterior a la nueva —no
  parpadea— con `--ease-standard`, 260ms. Da continuidad física a "moví el
  cursor del instrumento".
- **Panel derecho**: contenido *keyed* por `githubUsername` dentro de
  `AnimatePresence`. Salida/entrada = fade + translate-Y de 8px, 220ms,
  `--ease-standard`. Se *actualiza*, no cambia de golpe.

### 5.2 El héroe — revelación del `overallScore`
Ocurre dentro del **pozo oscuro** (`#101216`), en secuencia:

1. **t=0–700ms — barrido del arco.** Un arco radial (stroke SVG /
   conic-gradient) barre de 0 al valor con `--ease-readout`
   (`cubic-bezier(0.16, 1, 0.3, 1)`, expo-out): arranca rápido, asienta
   lento, como aguja de instrumento estabilizándose.
2. **t=0–700ms — conteo del dígito.** El número héroe (Space Grotesk)
   cuenta `0.0 → score` sincronizado con el arco, `tabular-nums` para que
   no "salte" el ancho.
3. **t≈500ms — línea de escaneo.** Una fina línea lima barre una vez el
   pozo de arriba a abajo y se desvanece (200ms) — el "settle" del readout.
4. **t=560–900ms — meters de submétricas.** Dos barras finas
   (`comprensión` Iris, `riesgos` Voltio) se llenan de izq. a der.,
   escalonadas 60ms entre sí, con `--ease-standard`.

Total ≈ 900ms, se siente instrumental, no lúdico.

### 5.3 `prefers-reduced-motion` (siempre respetado)
Cuando está activo: **sin** barrido, **sin** conteo, **sin** línea de
escaneo, **sin** deslizamiento del indicador ni translate del panel.
Todo aparece en su **valor final** con un único fade de opacidad de 120ms.
El indicador activo salta directo a la fila nueva. Ninguna información se
transmite *solo* por movimiento.

### 5.4 Tokens de movimiento
| Token | Valor |
|-------|-------|
| `--ease-standard` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| `--ease-readout` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--dur-fast` | 120ms |
| `--dur-panel` | 220ms |
| `--dur-select` | 260ms |
| `--dur-readout` | 700ms |

---

## 6. Contraste verificado (WCAG 2.1, sobre superficie base)

Ratios calculados (relative luminance). Detalle numérico en `tokens.css`.

**Modo oscuro** (base Grafito `#15171C`):
- Texto Cal — **15.9:1** ✓ AAA
- Mudo Bruma `#8A93A0` — **5.77:1** ✓ AA
- Voltio (dígito héroe, sobre pozo `#101216`) — **15.1:1** ✓ AAA
- Iris (ring/UI) — **4.5:1** ✓ (>3:1 UI)
- Ámbar (indicador) — **9.56:1** ✓

**Modo claro** (base Cal `#F0F2F1`):
- Texto Grafito — **15.9:1** ✓ AAA
- Mudo `#59606B` — **5.64:1** ✓ AA
- Interacción Iris `#5B4BD6` — **5.46:1** ✓ AA
- Iris (ring/UI) — **3.55:1** ✓ (>3:1 UI)
- Voltio (dígito héroe, sobre pozo `#101216`) — **15.1:1** ✓ AAA
  *(el readout es oscuro en ambos modos, por eso la lima nunca pierde contraste)*

---

## 7. Handoff a Desarrollo

`frontend-dashboard` construye con estos tokens (`tokens.css`) + Base UI +
Motion. Yo entrego tokens y dirección; no escribo el componente.

Puntos que no negociar en la implementación:
1. El readout del score va sobre **pozo oscuro en ambos modos**.
2. El valor del score se codifica por **relleno**, no por matiz (nada de
   rojo/verde).
3. Foco de teclado visible siempre; selección por ↑/↓ + Enter.
4. `prefers-reduced-motion` corta todo el movimiento a un fade de 120ms.
