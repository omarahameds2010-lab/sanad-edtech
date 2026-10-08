import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Badge variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Show dot indicator */
  dot?: boolean;
  /** Dot color */
  dotColor?: string;
  /** Removable badge */
  removable?: boolean;
  /** Remove callback */
  onRemove?: () => void;
}

const sizeStyles = {
  sm: { padding: '2px 6px', fontSize: '10px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '3px 8px', fontSize: '11px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-lg)' },
};

const variantStyles = {
  default: { background: 'var(--color-primary-100)', color: 'var(--color-primary)' },
  success: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
  warning: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  error: { background: 'var(--color-error-bg)', color: 'var(--color-error)' },
  info: { background: 'var(--color-info-bg)', color: 'var(--color-info)' },
  neutral: { background: 'var(--color-neutral-100)', color: 'var(--color-text-primary)' },
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', dot, dotColor, removable, onRemove, ...props }, ref) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
      <motion.span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: sizeStyles[size].padding,
          fontSize: sizeStyles[size].fontSize,
          fontWeight: 600,
          lineHeight: 1,
          borderRadius: sizeStyles[size].borderRadius,
          backgroundColor: variantStyles[variant].background,
          color: variantStyles[variant].color,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          ...props,
        }
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {dot && (
          <motion.span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: dotColor || 'currentColor',
              marginRight: '4px',
              flexShrink: 0,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
        <span>{children}</span>
        {removable && (
          <motion.button
            onClick={onRemove}
            style={{
              marginLeft: '4px',
              padding: '0',
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
            }}
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.9 }}
            aria-label="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        )}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };