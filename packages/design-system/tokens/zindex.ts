/**
 * Z-Index & Layer Tokens
 * 
 * Consistent z-index layering system.
 */

// ============================================
// Z-INDEX LAYERS
// ============================================

export const zIndex = {
  // Base layers
  hide: -1,
  base: 0,

  // Content layers
  content: 1,

  // Navigation
  dropdown: 100,
  sticky: 200,

  // Fixed positioning
  fixed: 300,

  // Overlay layers
  drawer: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,

  // System
  notification: 800,
  modal: 500,
  drawer: 400,
  popover: 600,
  tooltip: 700,
  toast: 800,

  // System overlays
  loader: 900,
  modal: 500,
  modalBackdrop: 499,
  drawer: 400,
  drawerBackdrop: 399,
  tooltip: 700,
  toast: 800,
  notification: 800,
  notificationContainer: 800,

  // System
  max: 9999,
} as const;

// ============================================
// LAYER NAMES (for semantic use)
// ============================================

export const layer = {
  base: 0,
  content: 1,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  drawer: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  notification: 800,
} as const;

// ============================================
// SEMANTIC Z-INDEX MAP
// ============================================

export const zIndexMap = {
  // Base
  base: 0,
  content: 1,

  // Dropdowns
  dropdown: 100,
  select: 100,
  autocomplete: 100,
  combobox: 100,
  menu: 100,
  popover: 100,

  // Sticky elements
  sticky: 200,
  header: 200,
  nav: 200,
  tabs: 200,
  toolbar: 200,

  // Fixed elements
  fixed: 300,
  header: 200,
  footer: 200,
  sidebar: 200,
  chat: 300,
  chatButton: 300,

  // Overlays
  drawer: 400,
  sidebar: 400,
  sheet: 400,
  drawerBackdrop: 399,

  // Modals
  modal: 500,
  dialog: 500,
  modalBackdrop: 499,
  alert: 500,
  confirm: 500,

  // Popovers
  popover: 600,
  popover: 600,
  tooltip: 700,
  popover: 600,

  // Tooltips
  tooltip: 700,
  tooltip: 700,
  tour: 700,

  // Toasts & notifications
  toast: 800,
  toast: 800,
  notification: 800,
  notification: 800,
  banner: 800,
  snackbar: 800,

  // System
  loader: 900,
  loader: 900,
  modal: 500,
  modalBackdrop: 499,
  notification: 800,
  banner: 800,

  // Max
  max: 9999,
} as const;

// ============================================
// SEMANTIC Z-INDEX MAP
// ============================================

export const zIndexMap = {
  // Base
  base: 0,
  content: 1,

  // Dropdowns
  dropdown: 100,
  select: 100,
  autocomplete: 100,
  combobox: 100,
  menu: 100,
  popover: 100,

  // Sticky elements
  sticky: 200,
  header: 200,
  nav: 200,
  tabs: 200,
  toolbar: 200,

  // Fixed elements
  fixed: 300,
  header: 200,
  footer: 200,
  sidebar: 200,
  chat: 300,
  chatButton: 300,

  // Overlays
  drawer: 400,
  sidebar: 400,
  sheet: 400,
  drawerBackdrop: 399,

  // Modals
  modal: 500,
  dialog: 500,
  modalBackdrop: 499,
  alert: 500,
  confirm: 500,

  // Popovers
  popover: 600,
  popover: 600,
  tooltip: 700,
  popover: 600,

  // Tooltips
  tooltip: 700,
  tooltip: 700,
  tour: 700,

  // Toast/Notification
  toast: 800,
  toast: 800,
  notification: 800,
  notification: 800,
  banner: 800,
  snackbar: 800,

  // System
  loader: 900,
  modal: 500,
  security: 900,
  max: 9999,
} as const;

// ============================================
// COMPONENT Z-INDEX MAP
// ============================================

export const componentZIndex = {
  // Navigation
  header: 200,
  nav: 200,
  breadcrumb: 200,
  pagination: 200,
  tabs: 200,
  stepper: 200,

  // Content
  content: 1,
  card: 1,
  section: 1,
  list: 1,
  table: 1,
  grid: 1,

  // Overlays
  dropdown: 100,
  dropdownMenu: 100,
  autocomplete: 100,
  select: 100,
  menus: 100,
  tooltips: 700,

  // Layout
  sidebar: 200,
  sidebarCollapsed: 200,
  sidebarBackdrop: 199,
  drawer: 400,
  drawerBackdrop: 399,
  sheet: 400,
  sheetBackdrop: 399,

  // Modals
  modal: 500,
  dialog: 500,
  modalBackdrop: 499,
  alert: 500,
  confirm: 500,
  confirmDialog: 500,

  // Popovers
  popover: 600,
  popoverMenu: 600,
  popoverTrigger: 600,

  // Tooltips
  tooltip: 700,
  tooltipTrigger: 700,
  tour: 700,

  // Notifications
  toast: 800,
  notification: 800,
  banner: 800,
  snackbar: 800,
  notificationCenter: 800,
  badge: 800,

  // System
  loader: 900,
  spinner: 900,
  skeleton: 900,
  progress: 900,

  // Max
  max: 9999,
} as const;

// ============================================
// RTL ADJUSTMENTS
// ============================================

export const rtlZIndex = {
  // In RTL, drawer comes from right
  drawer: 400,
  drawerBackdrop: 399,
  sheet: 400,
  sheetBackdrop: 399,
  sidebar: 200,
  sidebarCollapsed: 200,
  sidebarBackdrop: 199,
} as const;

// ============================================
// FOCUS RING Z-INDEX
// ============================================

export const focusRing = {
  zIndex: 1000,
  width: '2px',
  offset: '2px',
  color: 'border.focus',
} as const;

// ============================================
// OVERLAY OPACITY
// ============================================

export const overlayOpacity = {
  none: '0',
  light: '0.1',
  medium: '0.3',
  heavy: '0.5',
  full: '0.8',
} as const;

// ============================================
// BACKGROUND BLUR
// ============================================

export const backdropBlur = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
} as const;

// ============================================
// BACKDROP FILTER
// ============================================

export const backdropFilter = {
  none: 'none',
  blur: 'blur(8px)',
  blurSm: 'blur(4px)',
  blurMd: 'blur(8px)',
  blurLg: 'blur(16px)',
  blurXl: 'blur(24px)',
  blur2xl: 'blur(40px)',
  blur3xl: 'blur(64px)',
  saturate: 'saturate(1.8)',
  saturate150: 'saturate(1.5)',
  saturate200: 'saturate(2)',
  brightness: 'brightness(0.5)',
  brightness50: 'brightness(0.5)',
  brightness75: 'brightness(0.75)',
  grayscale: 'grayscale(1)',
  sepia: 'sepia(1)',
  invert: 'invert(1)',
} as const;

// Type exports
export type ZIndex = typeof zIndex;
export type ZIndexMap = typeof zIndexMap;
export type ComponentZIndex = typeof componentZIndex;
export type RTLZIndex = typeof rtlZIndex;
export type FocusRing = typeof focusRing;
export type OverlayOpacity = typeof overlayOpacity;
export type BackdropBlur = typeof backdropBlur;
export type BackdropFilter = typeof backdropFilter;