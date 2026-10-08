/**
 * Border & Radius Tokens
 * 
 * Consistent border radius and border width system.
 */

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',

  // Semantic radius
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',

  // Component-specific
  button: '8px',
  input: '8px',
  card: '12px',
  modal: '16px',
  drawer: '16px',
  tooltip: '8px',
  badge: '9999px',
  avatar: '9999px',
  image: '8px',
  card: '12px',
  modal: '16px',
  drawer: '16px',
  popover: '12px',
  dropdown: '8px',
  menu: '8px',
  button: '8px',
  input: '8px',
  select: '8px',
  checkbox: '4px',
  radio: '9999px',
  switch: '9999px',
  progress: '9999px',
  slider: '9999px',
  avatar: '9999px',
  badge: '9999px',
  tag: '9999px',
  chip: '9999px',
  pill: '9999px',
} as const;

// ============================================
// BORDER WIDTH
// ============================================

export const borderWidth = {
  none: '0',
  thin: '1px',
  medium: '2px',
  thick: '3px',
  heavy: '4px',

  // Semantic
  none: '0',
  thin: '1px',
  medium: '2px',
  thick: '3px',
  heavy: '4px',

  // Semantic
  none: '0',
  thin: '1px',
  medium: '2px',
  thick: '3px',
  heavy: '4px',

  // Component-specific
  default: '1px',
  input: '1px',
  button: '1px',
  card: '1px',
  table: '1px',
  divider: '1px',
  focus: '2px',
  error: '2px',
  ring: '3px',
  focusRing: '3px',
  focusRingThick: '4px',
} as const;

// ============================================
// BORDER STYLE
// ============================================

export const borderStyle = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  double: 'double',
  groove: 'groove',
  ridge: 'ridge',
  inset: 'inset',
  outset: 'outset',
  none: 'none',
  hidden: 'hidden',
} as const;

// ============================================
// DIVIDER
// ============================================

export const divider = {
  width: '1px',
  color: 'border.light',
  style: 'solid',
  margin: '16px 0',
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
} as const;

// ============================================
// RING / FOCUS RING
// ============================================

export const ring = {
  width: {
    none: '0',
    thin: '1px',
    default: '2px',
    thick: '3px',
    focus: '3px',
    thick: '4px',
  },

  offset: {
    none: '0',
    sm: '1px',
    default: '2px',
    lg: '3px',
  },

  color: {
    default: 'border.focus',
    error: 'status.error',
    success: 'status.success',
    warning: 'status.warning',
    info: 'status.info',
    focus: 'primary.500',
  },

  offset: {
    none: '0',
    sm: '1px',
    default: '2px',
    lg: '3px',
  },

  offsetColor: {
    default: 'background.primary',
    inverse: 'background.inverse',
  },
} as const;

// ============================================
// OUTLINE
// ============================================

export const outline = {
  width: {
    none: '0',
    thin: '1px',
    default: '2px',
    thick: '3px',
  },

  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },

  offset: {
    none: '0',
    sm: '1px',
    default: '2px',
    lg: '3px',
  },

  color: {
    default: 'border.focus',
    error: 'status.error',
    success: 'status.success',
    warning: 'status.warning',
    info: 'status.info',
  },

  offset: {
    none: '0',
    sm: '1px',
    default: '2px',
    lg: '3px',
  },
} as const;

// ============================================
// SHADOW / ELEVATION
// ============================================

export const shadow = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  sm2: '0 2px 4px 0 rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',

  // Colored shadows
  primary: '0 10px 15px -3px rgb(255 153 0 / 0.3), 0 4px 6px -4px rgb(255 153 0 / 0.1)',
  error: '0 10px 15px -3px rgb(239 68 68 / 0.3), 0 4px 6px -4px rgb(239 68 68 / 0.1)',
  success: '0 10px 15px -3px rgb(34 197 94 / 0.3), 0 4px 6px -4px rgb(34 197 94 / 0.1)',
  warning: '0 10px 15px -3px rgb(245 158 11 / 0.3), 0 4px 6px -4px rgb(245 158 11 / 0.1)',

  // Colored glows
  glowPrimary: '0 0 20px 5px rgb(255 153 0 / 0.3)',
  glowError: '0 0 20px 5px rgb(239 68 68 / 0.3)',
  glowSuccess: '0 0 20px 5px rgb(34 197 94 / 0.3)',
  glowWarning: '0 0 20px 5px rgb(245 158 11 / 0.3)',

  // Component-specific
  card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  cardHover: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  dropdown: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  drawer: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  tooltip: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  tooltipHover: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

// ============================================
// OPACITY
// ============================================

export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',

  // Semantic
  disabled: '0.5',
  hover: '0.8',
  active: '0.6',
  overlay: '0.5',
  backdrop: '0.8',
  disabled: '0.5',
  placeholder: '0.4',
  subtle: '0.6',
  muted: '0.5',
} as const;

// ============================================
// TRANSFORM
// ============================================

export const transform = {
  scale: {
    0: '0',
    50: '0.5',
    75: '0.75',
    90: '0.9',
    95: '0.95',
    98: '0.98',
    100: '1',
    102: '1.02',
    105: '1.05',
    110: '1.1',
    125: '1.25',
    150: '1.5',
  },

  translate: {
    0: '0',
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },

  rotate: {
    0: '0deg',
    45: '45deg',
    90: '90deg',
    180: '180deg',
    270: '270deg',
    360: '360deg',
    '-45': '-45deg',
    '-90': '-90deg',
    '-180': '-180deg',
  },

  skew: {
    0: '0deg',
    3: '3deg',
    6: '6deg',
    12: '12deg',
  },
} as const;

// ============================================
// FILTER
// ============================================

export const filter = {
  blur: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
  },

  brightness: {
    0: '0',
    50: '0.5',
    75: '0.75',
    90: '0.9',
    100: '1',
    110: '1.1',
    125: '1.25',
    150: '1.5',
    200: '2',
  },

  contrast: {
    0: '0',
    50: '0.5',
    75: '0.75',
    100: '1',
    125: '1.25',
    150: '1.5',
    200: '2',
  },

  grayscale: {
    0: '0',
    50: '0.5',
    100: '1',
  },

  sepia: {
    0: '0',
    50: '0.5',
    100: '1',
  },

  saturate: {
    0: '0',
    50: '0.5',
    100: '1',
    150: '1.5',
    200: '2',
  },

  hueRotate: {
    0: '0deg',
    15: '15deg',
    30: '30deg',
    60: '60deg',
    90: '90deg',
    180: '180deg',
  },

  invert: {
    0: '0',
    100: '1',
  },

  opacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    80: '0.8',
    90: '0.9',
    100: '1',
  },

  dropShadow: {
    sm: '0 1px 1px rgb(0 0 0 / 0.05)',
    md: '0 4px 3px rgb(0 0 0 / 0.07)',
    lg: '0 4px 4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 13px rgb(0 0 0 / 0.08)',
    '2xl': '0 25px 25px rgb(0 0 0 / 0.15)',
    none: '0',
  },
} as const;

// Type exports
export type BorderRadius = typeof borderRadius;
export type BorderWidth = typeof borderWidth;
export type BorderStyle = typeof borderStyle;
export type Divider = typeof divider;
export type Ring = typeof ring;
export type Outline = typeof outline;
export type Shadow = typeof shadow;
export type Opacity = typeof opacity;
export type Transform = typeof transform;
export type Filter = typeof filter;