import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { motionStyles } from '../styles';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Disable animation */
  disableAnimation?: boolean;
}

const variantStyles = {
  primary: {
    background: 'var(--color-primary-500)',
    color: 'white',
    border: 'none',
    hover: { background: 'var(--color-primary-600)' },
    active: { background: 'var(--color-primary-700)' },
  },
  secondary: {
    background: 'var(--color-neutral-100)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-main)',
    hover: { background: 'var(--color-neutral-200)' },
    active: { background: 'var(--color-neutral-200)' },
  },
  outline: {
    background: 'transparent',
    color: 'var(--color-primary-500)',
    border: '1px solid var(--color-primary-500)',
    hover: { background: 'var(--color-primary-50)' },
    active: { background: 'var(--color-primary-100)' },
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: 'none',
    hover: { background: 'var(--color-neutral-100)' },
    active: { background: 'var(--color-neutral-200)' },
  },
  danger: {
    background: 'var(--color-error)',
    color: 'white',
    border: 'none',
    hover: { background: 'var(--color-error-dark)' },
    active: { background: 'var(--color-error-dark)' },
  },
  success: {
    background: 'var(--color-success)',
    color: 'white',
    border: 'none',
    hover: { background: 'var(--color-success-dark)' },
    active: { background: 'var(--color-success-dark)' },
  },
};

const sizeStyles = {
  xs: { padding: '4px 8px', fontSize: '11px', height: '24px', gap: '4px' },
  sm: { padding: '6px 12px', fontSize: '12px', height: '28px', gap: '6px' },
  md: { padding: '8px 16px', fontSize: '14px', height: '36px', gap: '8px' },
  lg: { padding: '12px 24px', fontSize: '16px', height: '44px', gap: '10px' },
  xl: { padding: '16px 32px', fontSize: '16px', height: '52px', gap: '12px' },
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Disable animation */
  disableAnimation?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText = 'Loading...',
      fullWidth = false,
      leftIcon,
      rightIcon,
      disableAnimation = false,
      disabled,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    const isLoading = loading || disabled;

    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 500,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-sans)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.7 : 1,
      transition: 'all var(--motion-fast) var(--ease-standard)',
      border: 'none',
      outline: 'none',
      width: fullWidth ? '100%' : 'auto',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && !loading) {
          // Click will be triggered automatically
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (disabled || loading) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        style={{
          ...baseStyles,
          ...sizeStyles[size],
          ...variantStyles[variant],
        } as React.CSSProperties}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!loading ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15, ease: 'ease-out' }}
        {...props}
      >
        {loading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </motion.span>
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };