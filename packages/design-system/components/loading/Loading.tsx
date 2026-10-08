import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface LoadingProps {
  /** Loading variant */
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring' | 'skeleton';
  /** Size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color */
  color?: string;
  /** Size in pixels (overrides size) */
  sizePx?: number;
  /** Label for accessibility */
  label?: string;
  /** Overlay mode */
  overlay?: boolean;
  /** Overlay message */
  overlayMessage?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const spinnerStyles = {
  spinner: {
    border: '3px solid var(--color-neutral-200)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  dots: {
    display: 'flex',
    gap: '4px',
  },
  pulse: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'var(--color-primary)',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  bars: {
    display: 'flex',
    gap: '4px',
    alignItems: 'flex-end',
    height: '100%',
  },
  ring: {
    border: '3px solid var(--color-neutral-200)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  skeleton: {
    background: 'linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-300) 50%, var(--color-neutral-200) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
} as const;

export interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring' | 'skeleton';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  sizePx?: number;
  label?: string;
  overlay?: boolean;
  overlayMessage?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  ({ variant = 'spinner', size = 'md', color, sizePx, label, overlay = false, overlayMessage, ...props }, ref) => {
    const sizePx = sizePx || sizeMap[size];

    const spinnerStyle = {
      width: sizePx,
      height: sizePx,
      border: '3px solid var(--color-neutral-200)',
      borderTopColor: 'var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    };

    const dotsStyle = {
      display: 'flex',
      gap: '4px',
    };

    const dotStyle = {
      width: sizePx / 4,
      height: sizePx / 4,
      borderRadius: '50%',
      backgroundColor: 'var(--color-primary)',
      animation: 'bounce 1.4s ease-in-out infinite both',
    };

    const pulseStyle = {
      width: sizePx,
      height: sizePx,
      borderRadius: '50%',
      backgroundColor: 'var(--color-primary)',
      animation: 'pulse 1.5s ease-in-out infinite',
    };

    const barsStyle = {
      display: 'flex',
      gap: '4px',
      alignItems: 'flex-end',
      height: sizePx,
    };

    const barStyle = {
      width: '100%',
      backgroundColor: 'var(--color-primary)',
      animation: 'bars 1.2s ease-in-out infinite',
    };

    const ringStyle = {
      width: sizePx,
      height: sizePx,
      border: '3px solid var(--color-neutral-200)',
      borderTopColor: 'var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    };

    const skeletonStyle = {
      background: 'linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-300) 50%, var(--color-neutral-200) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    };

    const containerStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-md)',
    };

    const overlayStyle = {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
    };

    const containerStyle = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-md)',
      padding: 'var(--space-xl)',
      background: 'var(--color-surface-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
    };

    const labelStyle = {
      fontSize: '14px',
      color: 'var(--color-text-secondary)',
      textAlign: 'center',
      marginTop: 'var(--space-md)',
    };

    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const spinner = (
      <div style={{ ...spinnerStyle, width: size, height: size }} role="status" aria-label={label || 'Loading'} />
    );

    const dots = (
      <div style={dotsStyle}>
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            style={dotStyle}
            animate={{ scale: [1, 0.5, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        )}
      </div>
    );

    const pulse = (
      <motion.div style={pulseStyle} style={{ width: size, height: size }} />
    );

    const bars = (
      <div style={barsStyle}>
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            style={barStyle}
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
          />
        )}
      </div>
    );

    const ring = (
      <div style={{ ...ringStyle, width: size, height: size }} />
    );

    const skeleton = (
      <motion.div
        style={{ ...skeletonStyle, width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }}
      />
    );

    const content = {
      spinner,
      dots,
      pulse,
      bars,
      ring,
      skeleton,
    }[variant];

    if (overlay) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={overlayStyle}
          role="status"
          aria-label={label || 'Loading'}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={containerStyle}
          >
            {content}
            {overlayMessage && <p style={labelStyle}>{overlayMessage}</p>}
          </motion.div>
        </motion.div>
      );
    }

    return (
      <div ref={ref} style={containerStyles} role="status" aria-label={label || 'Loading'}>
        {content}
        {label && <p style={labelStyle}>{label}</p>}
      </div>
    );
  }
);

Loading.displayName = 'Loading';

export { Loading };
export type { LoadingProps };