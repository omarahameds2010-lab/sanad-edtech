import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom illustration */
  illustration?: React.ReactNode;
}

const sizeStyles = {
  sm: { iconSize: 48, titleSize: 16, padding: 24, maxWidth: 280 },
  md: { iconSize: 80, titleSize: 20, padding: 32, maxWidth: 360 },
  lg: { iconSize: 120, titleSize: 24, padding: 48, maxWidth: 480 },
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  size?: 'sm' | 'md' | 'lg';
  illustration?: React.ReactNode;
}

const sizeStyles = {
  sm: { iconSize: 48, titleSize: 16, padding: 24, maxWidth: 280 },
  md: { iconSize: 80, titleSize: 20, padding: 32, maxWidth: 360 },
  lg: { iconSize: 120, titleSize: 24, padding: 48, maxWidth: 480 },
};

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, size = 'md', illustration, ...props }, ref) => {
    const sizeStyle = sizeStyles[size];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'ease-out' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: sizeStyle.padding,
          maxWidth: sizeStyle.maxWidth,
          margin: 'auto',
        }
      >
        {illustration || icon ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              width: sizeStyle.iconSize,
              height: sizeStyle.iconSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)',
            }}
          >
            {illustration || icon}
          </motion.div>
        ) : null}

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'ease-out' }}
          style={{
            margin: 0,
            fontSize: sizeStyle.titleSize,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          {title}
        </motion.h2>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'ease-out' }}
            style={{
              margin: 'var(--space-sm) 0 0',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              maxWidth: '400px',
            }}
          >
            {description}
          </motion.p>
        )}

        {action && (
          <motion.button
            onClick={action.onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'ease-out' }}
            style={{
              marginTop: 'var(--space-lg)',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            }}
            whileHover={{ backgroundColor: 'var(--color-primary-hover)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { onClick?.(); }}
          >
            {action.label}
          </motion.button>
        )}
      </motion.div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
export type { EmptyStateProps };