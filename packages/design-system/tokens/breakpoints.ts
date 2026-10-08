/**
 * Breakpoint & Responsive Tokens
 * 
 * Consistent breakpoint system for responsive design.
 */

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  // Breakpoint values (mobile-first)
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',

  // Semantic breakpoints
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultra: '1536px',
} as const;

// ============================================
// MEDIA QUERIES
// ============================================

export const mediaQuery = {
  // Min-width queries (mobile-first)
  xs: '@media (min-width: 320px)',
  sm: '@media (min-width: 640px)',
  md: '@media (min-width: 768px)',
  lg: '@media (min-width: 1024px)',
  xl: '@media (min-width: 1280px)',
  '2xl': '@media (min-width: 1536px)',
  '3xl': '@media (min-width: 1920px)',

  // Max-width queries (desktop-first)
  'max-xs': '@media (max-width: 319px)',
  'max-sm': '@media (max-width: 639px)',
  'max-md': '@media (max-width: 767px)',
  'max-lg': '@media (max-width: 1023px)',
  'max-xl': '@media (max-width: 1279px)',
  'max-2xl': '@media (max-width: 1535px)',

  // Range queries
  smOnly: '@media (min-width: 640px) and (max-width: 767px)',
  mdOnly: '@media (min-width: 768px) and (max-width: 1023px)',
  lgOnly: '@media (min-width: 1024px) and (max-width: 1279px)',
  xlOnly: '@media (min-width: 1280px) and (max-width: 1535px)',

  // Orientation
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',

  // Hover/pointer
  hover: '@media (hover: hover)',
  noHover: '@media (hover: none)',
  finePointer: '@media (pointer: fine)',
  coarsePointer: '@media (pointer: coarse)',

  // Reduced motion
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  noReducedMotion: '@media (prefers-reduced-motion: no-preference)',

  // Color scheme
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  noPreference: '@media (prefers-color-scheme: no-preference)',

  // High contrast
  highContrast: '@media (prefers-contrast: more)',
  lowContrast: '@media (prefers-contrast: less)',

  // Print
  print: '@media print',
} as const;

// ============================================
// CONTAINER QUERIES
// ============================================

export const containerQuery = {
  xs: '@container (min-width: 320px)',
  sm: '@container (min-width: 640px)',
  md: '@container (min-width: 768px)',
  lg: '@container (min-width: 1024px)',
  xl: '@container (min-width: 1280px)',
  '2xl': '@container (min-width: 1536px)',
} as const;

// ============================================
// CONTAINER SIZES
// ============================================

export const containerSize = {
  // Max-width constraints
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px',
  '3xl': '1536px',
  full: '100%',
  prose: '65ch',
} as const;

// ============================================
// CONTAINER PADDING
// ============================================

export const containerPadding = {
  none: '0',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
  responsive: {
    xs: '16px',
    sm: '24px',
    md: '32px',
    lg: '48px',
    xl: '64px',
  },
} as const;

// ============================================
// GRID SYSTEM
// ============================================

export const grid = {
  columns: 12,
  gap: {
    none: '0',
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '32px',
  },

  // Column widths (fractions)
  col: {
    1: '8.333333%',
    2: '16.666667%',
    3: '25%',
    4: '33.333333%',
    5: '41.666667%',
    6: '50%',
    7: '58.333333%',
    8: '66.666667%',
    9: '75%',
    10: '83.333333%',
    11: '91.666667%',
    12: '100%',
    auto: 'auto',
    full: '100%',
  },

  // Responsive columns
  responsive: {
    1: '100%',
    2: '50%',
    3: '33.333333%',
    4: '25%',
    5: '20%',
    6: '16.666667%',
  },
} as const;

// ============================================
// FLEX/GRID UTILITIES
// ============================================

export const flex = {
  direction: {
    row: 'row',
    'row-reverse': 'row-reverse',
    col: 'column',
    'col-reverse': 'column-reverse',
  },

  wrap: {
    nowrap: 'nowrap',
    wrap: 'wrap',
    'wrap-reverse': 'wrap-reverse',
  },

  justify: {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
    stretch: 'stretch',
  },

  align: {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    baseline: 'baseline',
  },

  gap: {
    0: '0',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
} as const;

// ============================================
// FLEX GROW/SHRINK/BASIS
// ============================================

export const flexGrow = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
} as const;

export const flexShrink = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
} as const;

export const flexBasis = {
  auto: 'auto',
  0: '0',
  '1/2': '50%',
  '1/3': '33.333333%',
  '1/4': '25%',
  '1/5': '20%',
  '1/6': '16.666667%',
  full: '100%',
} as const;

// Type exports
export type Breakpoint = keyof typeof breakpoints;
export type MediaQuery = typeof mediaQuery;
export type ContainerQuery = typeof containerQuery;
export type ContainerSize = typeof containerSize;
export type ContainerPadding = typeof containerPadding;
export type Grid = typeof grid;
export type Flex = typeof flex;
export type FlexGrow = typeof flexGrow;
export type FlexShrink = typeof flexShrink;
export type FlexBasis = typeof flexBasis;