/**
 * Motion Tokens - Motion System
 * 
 * Centralized motion tokens for consistent animation across the platform.
 * Based on the motion hierarchy: Micro, Component, Transition, Hero.
 */

// ============================================
// DURATION TOKENS
// ============================================

export const duration = {
  // Micro interactions
  instant: '80ms',
  fast: '140ms',
  standard: '220ms',
  medium: '320ms',
  slow: '450ms',
  emphasis: '650ms',
  hero: '900ms',

  // Semantic durations
  instant: '80ms',
  fast: '140ms',
  normal: '220ms',
  medium: '320ms',
  slow: '450ms',
  emphasis: '650ms',
  hero: '900ms',
} as const;

// ============================================
// EASING CURVES
// ============================================

export const easing = {
  // Standard easing curves
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  linear: 'linear',

  // Semantic easing
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  emphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',

  // Spring/physics
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  springSoft: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
  springHard: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',

  // Semantic aliases
  easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easeEnter: 'cubic-bezier(0, 0, 0.2, 1)',
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
  easeEmphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================
// DISTANCE TOKENS
// ============================================

export const distance = {
  // Translation distances
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',

  // Micro distances (for subtle movements)
  micro: {
    xs: '1px',
    sm: '2px',
    md: '4px',
  },

  // Component transitions
  component: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '24px',
  },

  // Page transitions
  page: {
    sm: '8px',
    md: '24px',
    lg: '48px',
  },
} as const;

// ============================================
// DURATION SCALES BY HIERARCHY
// ============================================

export const durationScale = {
  // Micro interactions (80-180ms)
  micro: {
    instant: '80ms',
    fast: '120ms',
    normal: '140ms',
    slow: '180ms',
  },

  // Component interactions (180-320ms)
  component: {
    fast: '180ms',
    normal: '220ms',
    slow: '280ms',
    emphasis: '320ms',
  },

  // Transitions (300-500ms)
  transition: {
    fast: '250ms',
    normal: '350ms',
    slow: '450ms',
  },

  // Hero/Brand (500-1000ms)
  hero: {
    fast: '500ms',
    normal: '700ms',
    slow: '900ms',
    emphasis: '1200ms',
  },
} as const;

// ============================================
// MOTION SCALES BY CONTEXT
// ============================================

export const motionContext = {
  // Micro interactions
  micro: {
    press: { duration: '80ms', easing: 'ease-out' },
    hover: { duration: '120ms', easing: 'ease-out' },
    focus: { duration: '80ms', easing: 'ease-out' },
    toggle: { duration: '120ms', easing: 'ease-out' },
  },

  // Component transitions
  component: {
    dropdown: { duration: '200ms', easing: 'ease-out' },
    dialog: { duration: '200ms', easing: 'ease-out' },
    tab: { duration: '200ms', easing: 'ease-in-out' },
    accordion: { duration: '220ms', easing: 'ease-in-out' },
    drawer: { duration: '300ms', easing: 'ease-in-out' },
    modal: { duration: '200ms', easing: 'ease-out' },
    tooltip: { duration: '150ms', easing: 'ease-out' },
  },

  // Transitions
  transition: {
    page: { duration: '300ms', easing: 'ease-in-out' },
    drawer: { duration: '300ms', easing: 'ease-in-out' },
    dialog: { duration: '250ms', easing: 'ease-in-out' },
    layout: { duration: '300ms', easing: 'ease-in-out' },
  },

  // Hero/Brand
  hero: {
    reveal: { duration: '900ms', easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
    hero: { duration: '900ms', easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
  },

  // Subject-specific
  subject: {
    math: { duration: '300ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    physics: { duration: '400ms', easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' },
    arabic: { duration: '350ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    english: { duration: '300ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    chemistry: { duration: '400ms', easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' },
    computerScience: { duration: '300ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  },

  // Subject-specific distances
  distance: {
    math: { xs: '2px', sm: '4px', md: '8px', lg: '16px' },
    physics: { xs: '4px', sm: '8px', md: '16px', lg: '32px' },
    arabic: { xs: '2px', sm: '4px', md: '12px', lg: '24px' },
    english: { xs: '2px', sm: '4px', md: '8px', lg: '16px' },
    chemistry: { xs: '2px', sm: '6px', md: '12px', lg: '24px' },
    computerScience: { xs: '2px', sm: '4px', md: '8px', lg: '16px' },
  },
} as const;

// ============================================
// REDUCED MOTION TOKENS
// ============================================

export const reducedMotion = {
  // When prefers-reduced-motion is enabled
  reduced: {
    // Replace movement with instant/fade
    instant: '0ms',
    fast: '0ms',
    normal: '0ms',
    medium: '0ms',
    slow: '0ms',
    hero: '0ms',

    // Keep essential feedback
    instant: '0ms',
    fade: '100ms',
    crossfade: '150ms',

    // Preserve critical feedback
    focus: '0ms',
    press: '0ms',
    error: '100ms',
    success: '100ms',
  },

  // Minimal durations for reduced motion
  minimal: {
    micro: '1ms',
    component: '1ms',
    transition: '1ms',
    hero: '1ms',
  },
} as const;

// ============================================
// SEMANTIC MOTION MAP
// ============================================

export const semanticMotion = {
  // Interaction feedback
  press: { duration: '80ms', easing: 'ease-out', scale: 0.98 },
  hover: { duration: '120ms', easing: 'ease-out' },
  focus: { duration: '80ms', easing: 'ease-out' },
  active: { duration: '50ms', easing: 'ease-out' },

  // State changes
  loading: { duration: '1000ms', easing: 'linear', loop: true },
  success: { duration: '500ms', easing: 'ease-out' },
  error: { duration: '400ms', easing: 'ease-out' },
  warning: { duration: '500ms', easing: 'ease-out' },

  // Component transitions
  dropdown: { duration: '200ms', easing: 'ease-out' },
  dialog: { duration: '200ms', easing: 'ease-out' },
  drawer: { duration: '300ms', easing: 'ease-in-out' },
  modal: { duration: '200ms', easing: 'ease-out' },
  accordion: { duration: '220ms', easing: 'ease-in-out' },
  tabs: { duration: '200ms', easing: 'ease-in-out' },
  accordion: { duration: '220ms', easing: 'ease-in-out' },
  tooltip: { duration: '150ms', easing: 'ease-out' },

  // Page/Route transitions
  page: { duration: '300ms', easing: 'ease-in-out' },
  drawer: { duration: '300ms', easing: 'ease-in-out' },
  dialog: { duration: '250ms', easing: 'ease-in-out' },
  sharedElement: { duration: '400ms', easing: 'ease-in-out' },

  // Hero/Brand
  hero: { duration: '900ms', easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
  architecturalReveal: { duration: '900ms', easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
  learningPath: { duration: '600ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  teacherPortal: { duration: '600ms', easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },

  // Subject-specific
  math: { duration: '300ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  physics: { duration: '400ms', easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' },
  arabic: { duration: '350ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  english: { duration: '300ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  chemistry: { duration: '400ms', easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)' },
  computerScience: { duration: '300ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },

  // Subject distances
  distance: {
    math: { xs: '2px', sm: '4px', md: '8px', lg: '16px' },
    physics: { xs: '4px', sm: '8px', md: '16px', lg: '32px' },
    arabic: { xs: '2px', sm: '4px', md: '12px', lg: '24px' },
    english: { xs: '2px', sm: '4px', md: '8px', lg: '16px' },
    chemistry: { xs: '2px', sm: '6px', md: '12px', lg: '24px' },
    computerScience: { xs: '2px', sm: '4px', md: '8px', lg: '16px' },
  },

  // Component-specific
  button: {
    press: { scale: 0.98, duration: '80ms', easing: 'ease-out' },
    hover: { duration: '120ms', easing: 'ease-out' },
    loading: { duration: '1000ms', easing: 'linear' },
  },

  input: {
    focus: { duration: '120ms', easing: 'ease-out' },
    error: { duration: '120ms', easing: 'ease-out' },
  },

  card: {
    hover: { duration: '150ms', easing: 'ease-out', translateY: '-4px' },
    press: { duration: '80ms', easing: 'ease-out', scale: 0.98 },
  },

  // Page transitions
  page: { duration: '300ms', easing: 'ease-in-out' },
  sharedElement: { duration: '400ms', easing: 'ease-in-out' },
  teacherPortal: { duration: '600ms', easing: 'cubic-bezier(0.2, 0, 0.2, 1)' },
  learningPath: { duration: '500ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' },

  // Reduced motion
  reduced: {
    micro: '0ms',
    component: '0ms',
    transition: '0ms',
    hero: '0ms',
    // Keep essential feedback
    focus: '0ms',
    press: '0ms',
    error: '100ms',
    success: '100ms',
  },
} as const;

// Type exports
export type DurationTokens = typeof duration;
export type EasingTokens = typeof easing;
export type DistanceTokens = typeof distance;
export type MotionContext = typeof motionContext;
export type ReducedMotionTokens = typeof reducedMotion;
export type SemanticMotionMap = typeof semanticMotion;