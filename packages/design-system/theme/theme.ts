/**
 * Theme System - Theme Hierarchy & Configuration
 * 
 * Provides theming capabilities with support for:
 * - Platform theme (base)
 * - Tenant theme (white-label)
 * - Subject identity theming
 * - Component-level token overrides
 */

export interface ThemeConfig {
  name: string;
  extends?: string;
  colors?: Partial<ColorTokens>;
  spacing?: Partial<SpacingTokens>;
  typography?: Partial<TypographyTokens>;
  motion?: Partial<MotionTokens>;
  borderRadius?: Partial<BorderRadiusTokens>;
  shadows?: Partial<ShadowTokens>;
  breakpoints?: Partial<BreakpointTokens>;
}

export interface ThemeContext {
  platform: ThemeConfig;
  tenant?: ThemeConfig;
  subject?: ThemeConfig;
  teacher?: ThemeConfig;
  resolved: ResolvedTheme;
}

export interface ResolvedTheme {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  motion: MotionTokens;
  borderRadius: BorderRadiusTokens;
  shadows: ShadowTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
}

/** Color tokens — flat palette (base + semantic + neutrals) */
export interface ColorTokens {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
}

/** Spacing tokens — base unit + scale */
export interface SpacingTokens {
  base: number;
  scale: number[];
}

/** Typography tokens */
export interface TypographyTokens {
  fontFamily: {
    sans: string;
    arabic: string;
    mono: string;
  };
  fontSizes: Record<string, string | number>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, number>;
}

/** Motion tokens */
export interface MotionTokens {
  duration: Record<string, string>;
  easing: Record<string, string>;
}

export type BorderRadiusTokens = Record<string, string>;
export type ShadowTokens = Record<string, string>;
export type BreakpointTokens = Record<string, string>;
export type ZIndexTokens = Record<string, number>;

// ============================================
// DEFAULT PLATFORM THEME
// ============================================

export const platformTheme = {
  name: 'platform',
  colors: {
    primary: '#ff9900',
    primaryHover: '#e67e00',
    primaryLight: '#fff8ed',
    primaryDark: '#cc6600',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    surface: '#fafafa',
    border: '#e5e5e5',
    text: '#171717',
    textMuted: '#a3a3a3',
  },
  spacing: {
    base: 4,
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],

  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      arabic: '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': 36,
      '5xl': 48,
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.1,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  motion: {
    duration: {
      instant: '80ms',
      fast: '140ms',
      standard: '220ms',
      medium: '320ms',
      slow: '450ms',
      emphasis: '650ms',
      hero: '900ms',
    },
    easing: {
      standard: 'cubic-bezier(0.2, 0, 0, 1)',
      enter: 'cubic-bezier(0, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
      emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
      linear: 'linear',
    },
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    drawer: 1200,
    modal: 1300,
    toast: 1400,
    tooltip: 1500,
  }
};

// ============================================
// SUBJECT THEMES
// ============================================

export const subjectThemes = {
  math: {
    name: 'math',
    label: 'Mathematics',
    accent: '#2563eb',
    accentLight: '#eff6ff',
    accentDark: '#1d4ed8',
    motif: 'grid',
    pattern: 'grid',
    icon: 'calculator',
    description: 'Precise geometry, grids, coordinates, angles',
  },
  physics: {
    name: 'physics',
    label: 'Physics',
    accent: '#ea580c',
    accentLight: '#fff7ed',
    accentDark: '#c2410c',
    motif: 'wave',
    pattern: 'wave',
    icon: 'atom',
    description: 'Orbital curves, waves, field lines',
  },
  arabic: {
    name: 'arabic',
    label: 'Arabic',
    accent: '#d4a373',
    accentLight: '#fdf8f0',
    accentDark: '#b89050',
    motif: 'ink',
    pattern: 'ink',
    icon: 'book-open',
    description: 'Editorial typography, letter structures',
  },
  english: {
    name: 'english',
    label: 'English',
    accent: '#7c3aed',
    accentLight: '#f5f3ff',
    accentDark: '#6d28d9',
    motif: 'editorial',
    pattern: 'editorial',
    icon: 'book-open',
    description: 'Editorial grid, typographic rhythm',
  },
  chemistry: {
    name: 'chemistry',
    label: 'Chemistry',
    accent: '#059669',
    accentLight: '#ecfdf5',
    accentDark: '#047857',
    motif: 'molecular',
    pattern: 'hexagonal',
    icon: 'flask-conical',
    description: 'Molecular nodes, bond structures',
  },
  'computer-science': {
    name: 'computer-science',
    label: 'Computer Science',
    accent: '#4f46e5',
    accentLight: '#eef2ff',
    accentDark: '#4338ca',
    motif: 'graph',
    pattern: 'graph',
    icon: 'cpu',
    description: 'Logic blocks, node graphs',
  },
};

export interface TenantThemeConfig {
  tenantId: string;
  name: string;
  logo?: string;
  primaryColor: string;
  accentColor: string;
}

export interface SubjectTheme {
  name: string;
  label: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  motif: string;
  pattern: string;
  icon: string;
  description: string;
  colors?: Partial<ColorTokens>;
}

// ============================================
// THEME RESOLUTION
// ============================================

export function resolveTheme(
  platform: ThemeConfig,
  tenant?: ThemeConfig,
  subject?: ThemeConfig,
  teacher?: ThemeConfig
): ResolvedTheme {
  return {
    colors: {
      ...platformTheme.colors,
      ...tenant?.colors,
      ...subject?.colors,
      ...teacher?.colors,
    },
    spacing: {
      base: platformTheme.spacing.base,
      scale: (tenant?.spacing?.scale || platformTheme.spacing.scale) as number[],
    },
    typography: {
      ...platformTheme.typography,
      ...tenant?.typography,
      ...subject?.typography,
      ...teacher?.typography,
    } as TypographyTokens,
    motion: {
      ...platformTheme.motion,
      ...tenant?.motion,
    } as MotionTokens,
    borderRadius: {
      ...platformTheme.borderRadius,
      ...tenant?.borderRadius,
    },
    shadows: {
      ...platformTheme.shadows,
      ...tenant?.shadows,
    },
    breakpoints: {
      ...platformTheme.breakpoints,
    },
    zIndex: {
      ...platformTheme.zIndex,
    }
  };
}

export function getSubjectTheme(subjectKey: keyof typeof subjectThemes) {
  return subjectThemes[subjectKey] || subjectThemes.math;
}

export function generateCSSVariables(theme: ResolvedTheme): string {
  return `:root { --color-primary: ${theme.colors.primary}; }`;
}
