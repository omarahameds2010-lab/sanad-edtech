import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface SkeletonProps {
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Border radius */
  borderRadius?: string;
  /** Animation variant */
  animation?: 'pulse' | 'wave' | 'none';
  /** Base color */
  baseColor?: string;
  /** Highlight color */
  highlightColor?: string;
}

const variantStyles = {
  text: { borderRadius: 'var(--radius-sm)', height: '16px' },
  circular: { borderRadius: '50%' },
  rectangular: { borderRadius: 'var(--radius-md)' },
  card: { borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
} as const;

const animationStyles = {
  pulse: {
    initial: { opacity: 0.4 },
    animate: { opacity: [0.4, 1, 0.4] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
  wave: {
    initial: { backgroundPosition: '-200% 0' },
    animate: { backgroundPosition: ['200% 0', '-200% 0'] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
  },
  none: {},
} as const;

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width = '100%', height, borderRadius, animation = 'pulse', baseColor, highlightColor, ...props }, ref) => {
    const variantStyle = variantStyles[variant];

    const animationStyle = animationStyles[animation];

    const base = baseColor || 'var(--color-neutral-200)';
    const highlight = highlightColor || 'var(--color-neutral-300)';

    const gradientStyle = animation === 'wave' ? {
      background: `linear-gradient(90deg, ${base} 25%, ${highlight} 50%, ${base} 75%)`,
      backgroundSize: '200% 100%',
    } : { backgroundColor: base };

    return (
      <motion.div
        ref={ref}
        style={{
          width,
          height,
          borderRadius: borderRadius || variantStyle.borderRadius,
          ...gradientStyle,
          ...animationStyle,
        } as React.CSSProperties}
        initial={animationStyle.initial}
        animate={animationStyle.animate}
        transition={animationStyle.transition}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
export type { SkeletonProps };