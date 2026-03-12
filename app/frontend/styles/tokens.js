/**
 * Design Tokens — source de vérité pour tous les styles
 *
 * Aligné sur la charte graphique CI Dashboard.
 *
 * Usage dans un composant :
 *   import { colors, fonts, radii } from "../styles/tokens";
 *   style={{ color: colors.text, fontFamily: fonts.outfit }}
 */

export const colors = {
  // Surfaces
  bg: "#eef0f6",
  s1: "#ffffff",
  s2: "#f5f6fa",
  s3: "#eceef5",

  // Bordures
  border: "#e0e4ef",
  border2: "#c8cedc",

  // Texte
  text: "#16213a",
  text2: "#5a6a85",
  text3: "#9aaabe",

  // Sémantiques — sévérité
  critical: "#dc2626",
  high: "#ea6c10",
  medium: "#b58a00",
  low: "#16a34a",

  // IA
  ai: "#7c3aed",
  ai2: "#6d28d9",

  // Accent
  accent: "#2563eb",

  // Domaines métier CI (pour badges, tags, etc.)
  domains: {
    finance: "#2563eb",
    it: "#7c3aed",
    rh: "#0891b2",
    achats: "#d97706",
    logistique: "#db2777",
    juridique: "#059669",
  },
};

export const fonts = {
  outfit: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  dmMono: '"DM Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
};

export const radii = {
  card: "7px",
  button: "6px",
  pill: "20px",
  avatar: "50%",
};

export const shadows = {
  none: "none",
  header: "0 1px 6px rgba(0,0,0,.06)",
  card: "0 1px 3px rgba(0,0,0,.04)",
  dropdown: "0 4px 12px rgba(0,0,0,.08)",
};

export const spacing = {
  0: "0",
  1: "0.25rem",  // 4px
  2: "0.5rem",   // 8px
  3: "0.75rem",  // 12px
  4: "1rem",     // 16px
  5: "1.25rem",  // 20px
  6: "1.5rem",   // 24px
  8: "2rem",     // 32px
  10: "2.5rem",  // 40px
  12: "3rem",    // 48px
  16: "4rem",    // 64px
};

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
};

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
};

// Export groupé pour import unique
const tokens = { colors, fonts, radii, shadows, spacing, breakpoints, zIndex };
export default tokens;
