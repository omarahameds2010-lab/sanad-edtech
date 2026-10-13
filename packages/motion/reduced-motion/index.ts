/**
 * Reduced Motion Utilities
 * 
 * Utilities for handling prefers-reduced-motion preference.
 */

import { useEffect, useState } from 'react';

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean;
/**
 * Hook for conditional animation based on reduced motion preference
 */
export function useReducedMotion<T>(normalValue: T, reducedValue: T): T;
export function useReducedMotion<T>(normalValue?: T, reducedValue?: T): boolean | T {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (normalValue === undefined) return reduced;
  return reduced ? (reducedValue as T) : (normalValue as T);
}

/**
 * Get motion values based on reduced motion preference
 */
export function getMotionValues<T extends Record<string, any>>(
  normalValues: T,
  reducedValues: Partial<T> = {}
): T {
  if (typeof window === 'undefined') return normalValues;
  
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReduced) {
    return {
      ...normalValues,
      ...reducedValues,
    };
  }
  
  return normalValues;
}

/**
 * Motion variants for reduced motion
 */
export const reducedMotionVariants = {
  // Replace movement with instant/fade
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  
  // Replace transitions with instant
  transition: {
    duration: 0,
  },
  
  // Keep essential feedback
  focus: { scale: 1 },
  press: { scale: 1 },
  hover: {},
};

/**
 * Create motion props based on reduced motion preference
 */
export function createMotionProps<T extends Record<string, any>>(
  normalProps: T,
  reducedProps: Partial<T> = {}
): T {
  if (typeof window === 'undefined') return normalProps;
  
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReduced) {
    return {
      ...normalProps,
      ...reducedProps,
      // Override transitions
      transition: { duration: 0 },
      // Disable layout animations
      layout: false,
    };
  }
  
  return normalProps;
}

/**
 * Hook for conditional animation
 */
export function useMotion(
  normalVariants: any,
  reducedVariants?: any
) {
  const reduced = useReducedMotion();
  
  return reduced ? (reducedVariants || { initial: false, animate: false }) : normalVariants;
}

/**
 * Reduced motion CSS class
 */
export const reducedMotionClass = `
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

/**
 * CSS-in-JS reduced motion styles
 */
export const reducedMotionStyles = {
  '@media (prefers-reduced-motion: reduce)': {
    '*': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      scrollBehavior: 'auto !important',
    },
    // Keep essential feedback
    '*[data-focus-visible]': {
      transitionDuration: '0ms',
    },
  },
} as const;

/**
 * Motion configuration for reduced motion
 */
export const reducedMotionConfig = {
  // Disable all animations
  animations: false,
  transitions: false,
  layoutAnimations: false,
  
  // Keep essential
  focusVisible: true,
  errorStates: true,
  loadingStates: true,
  
  // Override durations
  duration: 0,
  delay: 0,
} as const;

export default {
  useReducedMotion,
  useReducedMotionValue: useReducedMotion,
  getMotionValues,
  createMotionProps,
  reducedMotionVariants,
  reducedMotionConfig,
  reducedMotionClass: `
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  `,
  reducedMotionStyles,
};