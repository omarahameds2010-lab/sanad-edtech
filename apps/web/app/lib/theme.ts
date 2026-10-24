/**
 * Theme primitives shared by the server layout and the client provider.
 *
 * The platform keeps graphite as the default register. The academic light
 * register is an explicit, persistent choice made from the student topbar.
 */

export const THEME_STORAGE_KEY = "sanad:theme";
export const THEME_ATTRIBUTE = "data-theme";
export const DEFAULT_THEME = "dark" as const;

export type Theme = "dark" | "light";

/** Any value that is not the explicit light choice falls back to graphite. */
export function normalizeTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : DEFAULT_THEME;
}

/**
 * Runs before the first paint so a persisted light session never flashes a
 * black canvas. Kept dependency-free because it is serialized into <head>.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var key="${THEME_STORAGE_KEY}";var saved=window.localStorage.getItem(key);var theme=saved==="light"?"light":"dark";var root=document.documentElement;root.setAttribute("${THEME_ATTRIBUTE}",theme);root.style.colorScheme=theme;}catch(error){document.documentElement.setAttribute("${THEME_ATTRIBUTE}","dark");}})();`;
