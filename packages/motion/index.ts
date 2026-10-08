/**
 * Motion System - Main Export
 * 
 * Central export point for the motion system.
 */

export * from './tokens';
export * from './primitives';
export * from './transitions';
export * from './patterns';
export * from './reduced-motion';

// Re-export types
export type {
  DurationTokens,
  EasingTokens,
  DistanceTokens,
  MotionContext,
  ReducedMotionTokens,
  SemanticMotionMap,
} from './tokens';

export type {
  FadeProps,
  SlideProps,
  ScaleProps,
  RevealProps,
} from './primitives';

export type {
  PageTransitionProps,
  SharedElementProps,
  LayoutTransitionProps,
} from './transitions';

export type {
  TeacherPortalProps,
  LearningPathProps,
  ArchitecturalRevealProps,
  SubjectMotionProps,
} from './patterns';