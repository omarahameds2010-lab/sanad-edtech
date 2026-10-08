import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<'div'> {
  /** Card variant */
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Hover effect */
  hoverable?: boolean;
  /** Clickable card */
  clickable?: boolean;
  /** Card header */
  header?: React.ReactNode;
  /** Card footer */
  footer?: React.ReactNode;
  /** Card image */
  image?: {
    src: string;
    alt: string;
    position?: 'top' | 'bottom';
  };
  /** Padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: {
    background: 'var(--color-surface-primary)',
    border: '1px solid var(--color-border-main)',
  },
  outlined: {
    background: 'var(--color-surface-primary)',
    border: '2px solid var(--color-border-main)',
  },
  elevated: {
    background: 'var(--color-surface-primary)',
    border: 'none',
    boxShadow: 'var(--shadow-lg)',
  },
  filled: {
    background: 'var(--color-surface-secondary)',
    border: 'none',
  },
};

const sizeStyles = {
  sm: { padding: '12px', borderRadius: 'var(--radius-md)' },
  md: { padding: '16px', borderRadius: 'var(--radius-lg)' },
  lg: { padding: '24px', borderRadius: 'var(--radius-xl)' },
};

const paddingStyles = {
  none: { padding: 0 },
  sm: { padding: '8px' },
  md: { padding: '16px' },
  lg: { padding: '24px' },
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  image?: {
    src: string;
    alt: string;
    position?: 'top' | 'bottom';
  };
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hoverable = false,
      clickable = false,
      header,
      footer,
      image,
      padding = 'md',
      className = '',
      style,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];
    const paddingStyle = paddingStyles[padding];

    return (
      <motion.div
        ref={ref}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...paddingStyles[padding],
        } as React.CSSProperties}
        whileHover={hoverable && !disabled ? { y: -4, boxShadow: 'var(--shadow-lg)' } : undefined}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2, ease: 'ease-out' }}
        onClick={onClick}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...paddingStyles[padding],
        } as React.CSSProperties}
      >
        {image && image.position !== 'bottom' && (
          <img
            src={image.src}
            alt={image.alt}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 'inherit',
              margin: '-16px -16px 16px -16px',
              objectFit: 'cover',
            }}
          )}
        {header && (
          <div style={{ marginBottom: '12px' }}>
            {header}
          </div>
        )}
        <div style={{ flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-main)' }}>
            {footer}
          </div>
        )}
        {image && image.position === 'bottom' && (
          <img
            src={image.src}
            alt={image.alt}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 'inherit',
              margin: '16px -16px -16px -16px',
              objectFit: 'cover',
            }}
          )}
        </motion.div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
export type { CardProps };