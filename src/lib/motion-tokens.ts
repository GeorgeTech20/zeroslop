// Espejo en JS de los tokens de movimiento de diseno/tokens.css (--ease-*,
// --dur-*). Motion necesita arrays de cubic-bezier y segundos, no las
// strings CSS — de ahí la duplicación puntual.

export const EASE_STANDARD: [number, number, number, number] = [
  0.32, 0.72, 0, 1,
];
export const EASE_READOUT: [number, number, number, number] = [
  0.16, 1, 0.3, 1,
];

export const DUR_FAST = 0.12;
export const DUR_PANEL = 0.22;
export const DUR_SELECT = 0.26;
export const DUR_READOUT = 0.7;

// Fase 4 — onboarding. Espejo de --dur-arrive / --dur-breath en tokens.css.
export const DUR_ARRIVE = 0.56;
export const DUR_BREATH = 1.6;
