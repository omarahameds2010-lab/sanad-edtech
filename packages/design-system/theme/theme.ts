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

// Re-export token types
export type { ColorTokens, SpacingTokens, TypographyTokens, MotionTokens, BorderRadiusTokens, ShadowTokens, BreakpointTokens, ZIndexTokens } from '../tokens';

// ============================================
// DEFAULT PLATFORM THEME
// ============================================

export const platformTheme = {
  name: 'platform',
  colors: {
    // Base
    primary: '#ff9900',
    primaryHover: '#e67e00',
    primaryLight: '#fff8ed',
    primaryDark: '#cc6600',
    
    // Semantic
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Neutrals
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
} as const;

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
    description: 'Precise geometry, grids, coordinates, angles, mathematical structures',
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
    description: 'Orbital curves, waves, field lines, vectors, trajectories',
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
    description: 'Editorial typography, letter structures, calligraphic rhythm, ink-like geometry',
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
    description: 'Editorial grid, typographic rhythm, quotes, modular typography',
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
    description: 'Molecular nodes, bond structures, hexagonal patterns, scientific diagrams',
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
    description: 'Logic blocks, node graphs, code-inspired geometry, binary rhythm',
  },
} as const;

// ============================================
// TENANT THEME CONFIGURATION
// ============================================

export interface TenantThemeConfig {
  tenantId: string;
  name: string;
  logo?: string;
  logoDark?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  fontFamily?: {
    sans?: string;
    arabic?: string;
    mono?: string;
  };
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  spacingScale?: number;
  fontScale?: number;
  borderRadiusScale?: number;
  customCSS?: string;
  subject?: keyof typeof subjectThemes;
  customSubject?: SubjectTheme;
  features?: {
    enableAnimations?: boolean;
    enableGradients?: boolean;
    enableShadows?: boolean;
    compactMode?: boolean;
  };
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
}

// ============================================
// THEME RESOLUTION
// ============================================

export function resolveTheme(
  platform: ThemeConfig,
  tenant?: ThemeConfig,
  subject?: ThemeConfig,
  teacher?: ThemeConfig
): ThemeConfig {
  return {
    ...platformTheme,
    ...tenant,
    ...subject,
    ...teacher,
    colors: {
      ...platformTheme.colors,
      ...tenant?.colors,
      ...subject?.colors,
      ...teacher?.colors,
    },
    spacing: {
      ...platformTheme.spacing,
      ...tenant?.spacing,
      ...subject?.spacing,
      ...teacher?.spacing,
    },
    typography: {
      ...platformTheme.typography,
      ...tenant?.typography,
      ...subject?.typography,
      ...teacher?.typography,
    },
    motion: {
      ...platformTheme.motion,
      ...tenant?.motion,
      ...subject?.motion,
      ...teacher?.motion,
    },
    borderRadius: {
      ...platformTheme.borderRadius,
      ...tenant?.borderRadius,
      ...subject?.borderRadius,
      ...teacher?.borderRadius,
    },
    shadows: {
      ...platformTheme.shadows,
      ...tenant?.shadows,
      ...subject?.shadows,
      ...teacher?.shadows,
    },
  };
}

// ============================================
// SUBJECT THEME RESOLVER
// ============================================

export function getSubjectTheme(subject: string): typeof subjectThemes[keyof typeof subjectThemes] | null {
  return subjectThemes[subject as keyof typeof subjectThemes] || null;
}

export function getSubjectThemeCSSVars(subject: string): Record<string, string> {
  const theme = subjectThemes[subject as keyof typeof subjectThemes];
  if (!theme) return {};
  
  return {
    '--color-accent': theme.accent,
    '--color-accent-light': theme.accentLight,
    '--color-accent-dark': theme.accentDark,
    '--subject-motif': theme.motif,
    '--subject-pattern': theme.pattern,
    '--subject-icon': theme.icon,
  };
}

// ============================================
// TENANT THEME GENERATOR
// ============================================

export function generateTenantTheme(config: TenantThemeConfig): ThemeConfig {
  const subjectTheme = config.subject ? subjectThemes[config.subject] : null;
  const customSubject = config.customSubject;
  
  return {
    name: config.name,
    colors: {
      primary: config.primaryColor,
      secondary: config.secondaryColor || config.primaryColor,
      accent: config.accentColor,
      ...(config.subject ? subjectThemes[config.subject]?.colors : {}),
      ...(customSubject ? customSubject.colors : {}),
    },
    spacing: {
      base: 4,
      scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
    },
    typography: {
      fontFamily: {
        sans: config.fontFamily?.sans || 'Inter, system-ui, sans-serif',
        arabic: config.fontFamily?.arabic || '"IBM Plex Sans Arabic", "Noto Sans Arabic", system-ui, sans-serif',
        mono: config.fontFamily?.mono || 'JetBrains Mono, monospace',
      },
      fontSizes: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': 30,
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
  };
}

// ============================================
// CSS VARIABLES GENERATOR
// ============================================

export function generateCSSVariables(theme: ThemeConfig): string {
  const lines: string[] = [':root {'];
  
  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    lines.push(`  --color-${kebabCase(key)}: ${value};`);
  });
  
  // Spacing
  lines.push(`  --space-base: ${theme.spacing.base}px;`);
  theme.spacing.scale.forEach((size, i) => {
    lines.push(`  --space-${i}: ${size}px;`);
  });
  
  // Typography
  Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
    lines.push(`  --text-${key}: ${value};`);
  });
  
  Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
    lines.push(`  --font-weight-${key}: ${value};`);
  });
  
  Object.entries(theme.typography.lineHeights).forEach(([key, value]) => {
    lines.push(`  --leading-${key}: ${value};`);
  });
  
  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    lines.push(`  --radius-${key}: ${value};`);
  });
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    lines.push(`  --shadow-${key}: ${value};`);
  });
  
  // Breakpoints
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    lines.push(`  --bp-${key}: ${value};`);
  });
  
  lines.push('}');
  
  return lines.join('\n');
}

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Type definitions (re-exported from tokens)
export type {
  ColorTokens,
  SpacingTokens,
  TypographyTokens,
  MotionTokens,
  BorderRadiusTokens,
  ShadowTokens,
  BreakpointTokens,
} from './tokens';