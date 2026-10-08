/**
 * Typography Tokens - Type System
 * 
 * Distinctive but highly readable type system.
 * Supports Arabic and English with carefully matched systems.
 */

// ============================================
// FONT FAMILIES
// ============================================

export const fontFamily = {
  // Primary font families
  sans: {
    arabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
    latin: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
    display: '"IBM Plex Sans Arabic", "Inter", system-ui, sans-serif',
  },
  mono: {
    arabic: '"IBM Plex Mono Arabic", "JetBrains Mono", monospace',
    latin: '"JetBrains Mono", "IBM Plex Mono", monospace',
  },

  // Legacy aliases
  sansArabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
  sansLatin: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
  monoArabic: '"IBM Plex Mono Arabic", "JetBrains Mono", monospace',
  monoLatin: '"JetBrains Mono", "IBM Plex Mono", monospace',
} as const;

// ============================================
// FONT WEIGHTS
// ============================================

export const fontWeight = {
  thin: 100,
  extraLight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
} as const;

// ============================================
// LINE HEIGHTS
// ============================================

export const lineHeight = {
  none: 1,
  tight: 1.1,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// ============================================
// FONT SIZES - Fluid/Responsive Scale
// ============================================

export const fontSize = {
  // Display sizes - for hero/marketing
  display: {
    '2xl': { size: '72px', lineHeight: '1.1', weight: 700, letterSpacing: '-0.02em' },
    xl: { size: '60px', lineHeight: '1.1', weight: 700, letterSpacing: '-0.02em' },
    lg: { size: '48px', lineHeight: '1.15', weight: 700, letterSpacing: '-0.01em' },
    md: { size: '36px', lineHeight: '1.2', weight: 700, letterSpacing: '-0.01em' },
    sm: { size: '30px', lineHeight: '1.25', weight: 700, letterSpacing: '-0.01em' },
    xs: { size: '24px', lineHeight: '1.3', weight: 700 },
  },

  // Heading sizes
  heading: {
    xl: { size: '30px', lineHeight: '1.3', weight: 700 },
    lg: { size: '24px', lineHeight: '1.3', weight: 600 },
    md: { size: '20px', lineHeight: '1.3', weight: 600 },
    sm: { size: '18px', lineHeight: '1.35', weight: 600 },
    xs: { size: '16px', lineHeight: '1.4', weight: 600 },
  },

  // Body sizes
  body: {
    xl: { size: '20px', lineHeight: '1.6', weight: 400 },
    lg: { size: '18px', lineHeight: '1.6', weight: 400 },
    md: { size: '16px', lineHeight: '1.6', weight: 400 },
    sm: { size: '14px', lineHeight: '1.5', weight: 400 },
    xs: { size: '12px', lineHeight: '1.5', weight: 400 },
  },

  // UI sizes
  ui: {
    xl: { size: '14px', lineHeight: '1.5', weight: 500 },
    md: { size: '13px', lineHeight: '1.5', weight: 500 },
    sm: { size: '12px', lineHeight: '1.5', weight: 500 },
    xs: { size: '11px', lineHeight: '1.5', weight: 500 },
  },

  // Caption/label sizes
  caption: {
    md: { size: '12px', lineHeight: '1.5', weight: 500 },
    sm: { size: '11px', lineHeight: '1.5', weight: 500 },
    xs: { size: '10px', lineHeight: '1.5', weight: 500 },
  },

  // Numeric/tabular
  numeric: {
    xl: { size: '24px', lineHeight: '1.3', weight: 600, tabular: true },
    lg: { size: '20px', lineHeight: '1.3', weight: 600, tabular: true },
    md: { size: '16px', lineHeight: '1.5', weight: 500, tabular: true },
    sm: { size: '14px', lineHeight: '1.5', weight: 500, tabular: true },
  },
} as const;

// ============================================
// SEMANTIC TEXT STYLES
// ============================================

export const textStyles = {
  // Display styles
  displayXl: { fontSize: '72px', lineHeight: '1.1', weight: 700, letterSpacing: '-0.02em' },
  displayLg: { fontSize: '60px', lineHeight: '1.1', weight: 700, letterSpacing: '-0.02em' },
  displayMd: { fontSize: '48px', lineHeight: '1.15', weight: 700, letterSpacing: '-0.01em' },
  displaySm: { fontSize: '36px', lineHeight: '1.2', weight: 700, letterSpacing: '-0.01em' },
  displayXs: { fontSize: '30px', lineHeight: '1.25', weight: 700, letterSpacing: '-0.01em' },

  // Heading styles
  h1: { fontSize: '30px', lineHeight: '1.3', weight: 700 },
  h2: { fontSize: '24px', lineHeight: '1.3', weight: 600 },
  h3: { fontSize: '20px', lineHeight: '1.3', weight: 600 },
  h4: { fontSize: '18px', lineHeight: '1.35', weight: 600 },
  h5: { fontSize: '16px', lineHeight: '1.4', weight: 600 },
  h6: { fontSize: '14px', lineHeight: '1.4', weight: 600 },

  // Body styles
  bodyXl: { fontSize: '20px', lineHeight: '1.6', weight: 400 },
  bodyLg: { fontSize: '18px', lineHeight: '1.6', weight: 400 },
  bodyMd: { fontSize: '16px', lineHeight: '1.6', weight: 400 },
  bodySm: { fontSize: '14px', lineHeight: '1.5', weight: 400 },
  bodyXs: { fontSize: '12px', lineHeight: '1.5', weight: 400 },

  // UI text
  uiXl: { fontSize: '14px', lineHeight: '1.5', weight: 500 },
  uiMd: { fontSize: '13px', lineHeight: '1.5', weight: 500 },
  uiSm: { fontSize: '12px', lineHeight: '1.5', weight: 500 },
  uiXs: { fontSize: '11px', lineHeight: '1.5', weight: 500 },

  // Caption
  captionMd: { fontSize: '12px', lineHeight: '1.5', weight: 500 },
  captionSm: { fontSize: '11px', lineHeight: '1.5', weight: 500 },
  captionXs: { fontSize: '10px', lineHeight: '1.5', weight: 500 },

  // Numeric
  numericXl: { fontSize: '24px', lineHeight: '1.3', weight: 600, tabular: true },
  numericLg: { fontSize: '20px', lineHeight: '1.3', weight: 600, tabular: true },
  numericMd: { fontSize: '16px', lineHeight: '1.5', weight: 500, tabular: true },
  numericSm: { fontSize: '14px', lineHeight: '1.5', weight: 500, tabular: true },

  // Labels
  labelLg: { fontSize: '14px', lineHeight: '1.5', weight: 500 },
  labelMd: { fontSize: '13px', lineHeight: '1.5', weight: 500 },
  labelSm: { fontSize: '12px', lineHeight: '1.5', weight: 500 },

  // Button text
  buttonLg: { fontSize: '16px', lineHeight: '1.5', weight: 600 },
  buttonMd: { fontSize: '14px', lineHeight: '1.5', weight: 600 },
  buttonSm: { fontSize: '13px', lineHeight: '1.5', weight: 600 },

  // Input text
  inputLg: { fontSize: '16px', lineHeight: '1.5', weight: 400 },
  inputMd: { fontSize: '14px', lineHeight: '1.5', weight: 400 },
  inputSm: { fontSize: '13px', lineHeight: '1.5', weight: 400 },

  // Link
  link: { fontSize: '14px', lineHeight: '1.5', weight: 500 },
  linkLg: { fontSize: '16px', lineHeight: '1.5', weight: 500 },
  linkSm: { fontSize: '13px', lineHeight: '1.5', weight: 500 },
} as const;

// ============================================
// RTL SUPPORT
// ============================================

export const rtl = {
  // Font families for RTL
  fontFamily: {
    arabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
    latin: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
  },

  // Directional adjustments
  direction: 'rtl' as const,
  textAlign: 'right' as const,
} as const;

// ============================================
// SEMANTIC TYPE MAP
// ============================================

export const semanticType = {
  // Display
  displayXl: 'display.2xl',
  displayLg: 'display.xl',
  displayMd: 'display.lg',
  displaySm: 'display.md',
  displayXs: 'display.xs',

  // Headings
  h1: 'heading.xl',
  h2: 'heading.lg',
  h3: 'heading.md',
  h4: 'heading.sm',
  h5: 'heading.xs',
  h6: 'heading.xs',

  // Body
  bodyXl: 'body.xl',
  bodyLg: 'body.lg',
  bodyMd: 'body.md',
  bodySm: 'body.sm',
  bodyXs: 'body.xs',

  // UI
  uiXl: 'ui.xl',
  uiMd: 'ui.md',
  uiSm: 'ui.sm',
  uiXs: 'ui.xs',

  // Caption
  captionMd: 'caption.md',
  captionSm: 'caption.sm',
  captionXs: 'caption.xs',

  // Numeric
  numericXl: 'numeric.xl',
  numericLg: 'numeric.lg',
  numericMd: 'numeric.md',
  numericSm: 'numeric.sm',

  // Labels
  labelLg: 'label.lg',
  labelMd: 'label.md',
  labelSm: 'label.sm',

  // Button
  buttonLg: 'button.lg',
  buttonMd: 'button.md',
  buttonSm: 'button.sm',

  // Input
  inputLg: 'input.lg',
  inputMd: 'input.md',
  inputSm: 'input.sm',

  // Link
  link: 'link',
  linkLg: 'link.lg',
  linkSm: 'link.sm',
} as const;

// Type exports
export type FontFamily = typeof fontFamily;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type FontSizeScale = typeof fontSize;
export type TextStyleMap = typeof textStyles;