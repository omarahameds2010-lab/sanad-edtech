/**
 * Spacing Tokens - Consistent Spacing System
 *
 * 4px base unit system with semantic naming.
 * Based on 4px grid for consistent alignment.
 */

// ============================================
// BASE SPACING SCALE
// ============================================

export const spacing = {
  // Base unit: 4px
  0: "0",
  1: "4px", // 4px
  2: "8px", // 8px
  3: "12px", // 12px
  4: "16px", // 16px
  5: "20px", // 20px
  6: "24px", // 24px
  8: "32px", // 32px
  10: "40px", // 40px
  12: "48px", // 48px
  16: "64px", // 64px
  20: "80px", // 80px
  24: "96px", // 96px
  32: "128px", // 128px
} as const;

// ============================================
// SEMANTIC SPACING
// ============================================

export const space = {
  // Micro spacing - for tight elements
  xs: "4px", // 1
  sm: "8px", // 2
  md: "16px", // 4
  lg: "24px", // 6
  xl: "32px", // 8
  "2xl": "48px", // 12
  "3xl": "64px", // 16
  "4xl": "96px", // 24

  // Component-specific
  component: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
  },

  // Layout spacing
  layout: {
    xs: "8px",
    sm: "16px",
    md: "24px",
    lg: "32px",
    xl: "48px",
    "2xl": "64px",
  },

  // Section spacing
  section: {
    sm: "24px",
    md: "48px",
    lg: "72px",
    xl: "96px",
  },

  // Container padding
  container: {
    sm: "16px",
    md: "24px",
    lg: "32px",
    xl: "48px",
  },

  // Inset/offset
  inset: {
    none: "0",
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
} as const;

// ============================================
// LAYOUT DIMENSIONS
// ============================================

export const layout = {
  // Container max widths
  container: {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1440px",
    full: "100%",
  },

  // Sidebar widths
  sidebar: {
    collapsed: "64px",
    narrow: "240px",
    default: "280px",
    wide: "320px",
    full: "100%",
  },

  // Header/Navigation heights
  header: {
    sm: "48px",
    md: "56px",
    lg: "64px",
  },

  // Footer heights
  footer: {
    sm: "48px",
    md: "64px",
    lg: "80px",
  },
} as const;

// ============================================
// COMPONENT DIMENSIONS
// ============================================

export const dimensions = {
  // Button heights
  button: {
    sm: "32px",
    md: "40px",
    lg: "48px",
    xl: "56px",
  },

  // Input heights
  input: {
    sm: "32px",
    md: "40px",
    lg: "48px",
  },

  // Icon sizes
  icon: {
    xs: "12px",
    sm: "16px",
    md: "20px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  },

  // Avatar sizes
  avatar: {
    xs: "24px",
    sm: "32px",
    md: "40px",
    lg: "56px",
    xl: "72px",
    "2xl": "96px",
  },

  // Border radius
  radius: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },

  // Border width
  border: {
    none: "0",
    thin: "1px",
    medium: "2px",
    thick: "3px",
  },

  // Shadows
  shadow: {
    none: "none",
    xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },

  // Z-index
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    drawer: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
  },
} as const;

// Type exports
export type SpacingScale = typeof spacing;
export type SpaceScale = typeof space;
export type LayoutDimensions = typeof layout;
export type Dimensions = typeof dimensions;
