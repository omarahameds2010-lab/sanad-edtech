/**
 * Color Tokens - Semantic Color System
 *
 * Master color palette with semantic naming for white-label theming.
 * All colors support light/dark modes and tenant theming.
 */

// ============================================
// MASTER COLOR PALETTE
// ============================================

export const colors = {
  // Base neutrals - Deep Graphite / Near Black / Warm Off-White
  neutral: {
    0: "#ffffff",
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
    1000: "#030303", // Deep Graphite / Near Black
  },

  // Warm neutrals for warm off-white feel
  warm: {
    50: "#fdfcfb",
    100: "#faf8f3",
    200: "#f5eee5",
    300: "#ebddd0",
    400: "#e0c9ad",
    500: "#d4b88c",
    600: "#c4a070",
    700: "#a88052",
    800: "#87633e",
    900: "#6b4e33",
  },

  // Primary brand colors - Electric/Intelligent accents
  primary: {
    50: "#fff8ed",
    100: "#fff0d6",
    200: "#ffdeac",
    300: "#ffc975",
    400: "#ffb13d",
    500: "#ff9900", // Primary amber - main brand
    600: "#e67e00",
    700: "#cc6600",
    800: "#a35000",
    900: "#804000",
    950: "#4d2000",
  },

  // Subject-specific accent families
  subject: {
    math: {
      light: "#3b82f6", // Blue - precision
      main: "#2563eb",
      dark: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
    physics: {
      light: "#f97316", // Orange - energy
      main: "#ea580c",
      dark: "#c2410c",
      bg: "#fff7ed",
      border: "#fed7aa",
    },
    arabic: {
      light: "#d4a373", // Amber/gold - culture
      main: "#d4a373",
      dark: "#b89050",
      bg: "#fdf8f0",
      border: "#fde8c8",
    },
    english: {
      light: "#8b5cf6", // Violet - expression
      main: "#7c3aed",
      dark: "#6d28d9",
      bg: "#f5f3ff",
      border: "#ddd6fe",
    },
    chemistry: {
      light: "#10b981", // Emerald - science
      main: "#059669",
      dark: "#047857",
      bg: "#ecfdf5",
      border: "#a7f3d0",
    },
    computerScience: {
      light: "#6366f1", // Indigo - logic
      main: "#4f46e5",
      dark: "#4338ca",
      bg: "#eef2ff",
      border: "#c7d2fe",
    },
  },

  // Semantic status colors
  status: {
    success: {
      light: "#86efac",
      main: "#22c55e",
      dark: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
    warning: {
      light: "#fde047",
      main: "#f59e0b",
      dark: "#d97706",
      bg: "#fffbeb",
      border: "#fde68a",
    },
    error: {
      light: "#fca5a5",
      main: "#ef4444",
      dark: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
    },
    info: {
      light: "#93c5fd",
      main: "#3b82f6",
      dark: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
  },

  // Background system
  background: {
    primary: "#ffffff",
    secondary: "#fafafa",
    tertiary: "#f5f5f5",
    inverse: "#030303",
    overlay: "rgba(3, 3, 3, 0.5)",
  },

  // Surface system
  surface: {
    primary: "#ffffff",
    secondary: "#fafafa",
    tertiary: "#f5f5f5",
    elevated: "#ffffff",
    sunken: "#f5f5f5",
    overlay: "rgba(255, 255, 255, 0.95)",
  },

  // Border system
  border: {
    light: "#e5e5e5",
    main: "#d4d4d4",
    dark: "#a3a3a3",
    focus: "#ff9900",
    error: "#ef4444",
    success: "#22c55e",
  },

  // Text system
  text: {
    primary: "#171717",
    secondary: "#525252",
    tertiary: "#a3a3a3",
    inverse: "#ffffff",
    link: "#ff9900",
    disabled: "#a3a3a3",
  },
} as const;

// ============================================
// DARK MODE OVERRIDES
// ============================================

export const darkColors = {
  neutral: {
    0: "#030303",
    50: "#171717",
    100: "#171717",
    200: "#262626",
    300: "#404040",
    400: "#525252",
    500: "#737373",
    600: "#a3a3a3",
    700: "#d4d4d4",
    800: "#e5e5e5",
    900: "#f5f5f5",
    950: "#fafafa",
    1000: "#ffffff",
  },
  background: {
    primary: "#030303",
    secondary: "#171717",
    tertiary: "#1a1a1a",
    inverse: "#ffffff",
    overlay: "rgba(255, 255, 255, 0.1)",
  },
  surface: {
    primary: "#171717",
    secondary: "#1f1f1f",
    tertiary: "#262626",
    elevated: "#262626",
    sunken: "#0f0f0f",
    overlay: "rgba(23, 23, 23, 0.95)",
  },
  border: {
    light: "#333333",
    main: "#404040",
    dark: "#525252",
    focus: "#ff9900",
    error: "#f87171",
    success: "#4ade80",
  },
  text: {
    primary: "#fafafa",
    secondary: "#d4d4d4",
    tertiary: "#a3a3a3",
    inverse: "#030303",
    link: "#ffb340",
    disabled: "#737373",
  },
} as const;

// ============================================
// SEMANTIC COLOR MAP
// ============================================

export const semanticColors = {
  // Core actions
  action: "primary.500",
  focus: "primary.500",
  brand: "primary.500",

  // States
  success: "status.success.main",
  warning: "status.warning.main",
  error: "status.error.main",
  info: "status.info.main",

  // Backgrounds
  bgPrimary: "background.primary",
  bgSecondary: "background.secondary",
  bgTertiary: "background.tertiary",

  // Surfaces
  surfacePrimary: "surface.primary",
  surfaceSecondary: "surface.secondary",
  surfaceElevated: "surface.elevated",

  // Text
  textPrimary: "text.primary",
  textSecondary: "text.secondary",
  textMuted: "text.tertiary",
  textInverse: "text.inverse",
  textLink: "text.link",
  textDisabled: "text.disabled",

  // Borders
  borderLight: "border.light",
  borderMain: "border.main",
  borderFocus: "border.focus",
} as const;

// Type exports
export type ColorScale = typeof colors.neutral;
export type SubjectColors = typeof colors.subject.math;
export type StatusColors = typeof colors.status.success;
export type SemanticColorMap = typeof semanticColors;
