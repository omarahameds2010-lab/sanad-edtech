import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Disable animation */
  disableAnimation?: boolean;
}

const sizeStyles = {
  sm: { padding: '8px 12px', fontSize: '13px', height: '36px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '10px 14px', fontSize: '14px', height: '40px', borderRadius: 'var(--radius-md)' },
  lg: { padding: '14px 16px', fontSize: '16px', height: '48px', borderRadius: 'var(--radius-lg)' },
} as const;

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = false,
      disableAnimation = false,
      disabled,
      required,
      id,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const baseStyles = {
      width: fullWidth ? '100%' : 'auto',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-md)',
      fontWeight: 400,
      lineHeight: 'var(--leading-normal)',
      color: 'var(--color-text-primary)',
      backgroundColor: 'var(--color-bg-primary)',
      border: '1px solid var(--color-border-main)',
      borderRadius: 'var(--radius-md)',
      outline: 'none',
      transition: 'all var(--motion-fast) var(--ease-standard)',
    };

    const hasError = !!error;

    const inputStyles = {
      ...baseStyles,
      ...sizeStyles[size],
      paddingLeft: leftIcon ? '40px' : undefined,
      paddingRight: rightIcon ? '40px' : undefined,
      borderColor: error ? 'var(--color-error)' : 'var(--color-border-main)',
      boxShadow: error ? '0 0 0 2px var(--color-error-bg)' : 'none',
    };

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label htmlFor={inputId} style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            marginBottom: '6px',
            display: 'block',
          }}>
            {label}
            {required && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: fullWidth ? '100%' : 'auto' }}>
          {leftIcon && (
            <span style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}>
              {leftIcon}
            </span>
          )}
          <motion.input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={`${errorId || ''} ${helperId || ''}`.trim() || undefined}
            aria-required={required}
            style={{
              ...inputStyles,
            } as React.CSSProperties}
            {...props}
            onFocus={(e) => {
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              props.onBlur?.(e);
            }}
          />
          {rightIcon && (
            <span style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}>
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            style={{
              margin: '6px 0 0',
              fontSize: '12px',
              color: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'ease-out' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={helperId} style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };