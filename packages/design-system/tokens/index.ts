/**
 * Design System Tokens - Main Export
 * 
 * Central export point for all design tokens.
 */

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './motion';
export * from './border';
export * from './zindex';
export * from './breakpoints';

// Re-export types from their source files
export type {
  ColorScale,
  SubjectColors,
  StatusColors,
  SemanticColorMap,
} from './colors';

export type {
  SpacingScale,
  SpaceScale,
  LayoutDimensions,
  Dimensions,
} from './spacing';

export type {
  FontFamily,
  FontWeight,
  LineHeight,
  FontSizeScale,
  TextStyleMap,
} from './typography';

export type {
  DurationTokens,
  EasingTokens,
  DistanceTokens,
  MotionContext,
  ReducedMotionTokens,
  SemanticMotionMap,
} from './motion';

export type {
  BorderRadius,
  BorderWidth,
  BorderStyle,
  Divider,
  Ring,
  Outline,
  Shadow,
  Opacity,
  Transform,
  Filter,
} from './border';

export type {
  ZIndex,
  ZIndexMap,
  ComponentZIndex,
  RTLZIndex,
  FocusRing,
  OverlayOpacity,
  BackdropBlur,
  BackdropFilter,
} from './zindex';

export type {
  Breakpoint,
  MediaQuery,
  ContainerQuery,
  ContainerSize,
  ContainerPadding,
  Grid,
  Flex,
  FlexGrow,
  FlexShrink,
  FlexBasis,
} from './breakpoints';