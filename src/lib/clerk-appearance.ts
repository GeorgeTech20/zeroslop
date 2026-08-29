// Mapeo de appearance de Clerk a los tokens de diseno/tokens.css, según
// diseno/onboarding-y-cuenta.md §6. Cada valor es un string `var(--token)`
// en vez de un hex resuelto: Clerk no re-evalúa estos valores en JS, los
// vuelca tal cual en el CSS que genera, así que es el browser quien
// resuelve el var() contra la cascada real en cada render. Como
// <ClerkProvider> vive dentro de <body>, por debajo de <html data-theme="...">
// (ver src/app/layout.tsx y el ThemeToggle que setea ese atributo), esto
// alcanza para que los componentes de Clerk cambien de tema solos cuando
// cambia [data-theme] — no hace falta leer el tema en runtime ni mantener
// dos objetos light/dark por separado.
export const clerkAppearance = {
  variables: {
    colorBackground: "var(--color-surface-1)",
    colorPrimary: "var(--brand-voltio)",
    colorText: "var(--color-text)",
    colorTextSecondary: "var(--color-text-muted)",
    colorInputBackground: "var(--color-bg)",
    colorInputText: "var(--color-text)",
    // No rojo/verde — coherencia dura del sistema (ver design-system.md).
    colorDanger: "var(--color-attention)",
    colorSuccess: "var(--brand-voltio)",
    colorNeutral: "var(--color-text)",
    // Voltio no contrasta con texto claro: el botón primario lleva texto grafito.
    colorTextOnPrimaryBackground: "var(--brand-grafito)",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-body)",
    fontFamilyButtons: "var(--font-body)",
    colorShimmer: "var(--color-wash-iris)",
  },
  elements: {
    card: {
      boxShadow: "none",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      backgroundColor: "var(--color-surface-1)",
    },
    headerTitle: {
      fontFamily: "var(--font-display)",
    },
    formButtonPrimary: {
      backgroundColor: "var(--brand-voltio)",
      color: "var(--brand-grafito)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "none",
      "&:hover, &:focus": {
        backgroundColor: "var(--brand-voltio)",
        filter: "brightness(1.06)",
      },
    },
    formFieldInput: {
      "&:focus": {
        outline: "2px solid var(--color-ring)",
        outlineOffset: "2px",
      },
    },
    socialButtonsBlockButton: {
      border: "1px solid var(--color-border-strong)",
      "&:hover": { borderColor: "var(--color-interactive)" },
    },
    footerActionLink: { color: "var(--color-interactive)" },
    identityPreviewEditButton: { color: "var(--color-interactive)" },
    badge: { border: "1px solid var(--color-border)" },
    avatarBox: {
      border: "1px solid var(--color-border)",
      "&:focus-visible": {
        outline: "2px solid var(--color-interactive)",
        outlineOffset: "2px",
      },
    },
    dividerLine: { backgroundColor: "var(--color-border)" },
    dividerText: {
      color: "var(--color-text-muted)",
      fontSize: "var(--fs-label)",
    },
  },
} as const;
