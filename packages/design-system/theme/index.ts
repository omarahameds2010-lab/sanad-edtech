/**
 * Theme System - Main Export
 *
 * Central export point for the theme system.
 */

export * from "./theme";
//export * from './theme.css';

// Re-export types
export type {
  ThemeConfig,
  ThemeContext,
  ResolvedTheme,
  TenantThemeConfig,
  SubjectTheme,
} from "./theme";

// Re-export functions
export {
  platformTheme,
  subjectThemes,
  resolveTheme,
  getSubjectTheme,
  getSubjectThemeCSSVars,
  generateTenantTheme,
  generateCSSVariables,
} from "./theme";
