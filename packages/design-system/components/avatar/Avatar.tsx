import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  bordered?: boolean;
}

const sizeStyles = {
  xs: { width: '24px', height: '24px', fontSize: '10px' },
  sm: { width: '32px', height: '32px', fontSize: '11px' },
  md: { width: '40px', height: '40px', fontSize: '14px' },
  lg: { width: '56px', height: '56px', fontSize: '18px' },
  xl: { width: '72px', height: '72px', fontSize: '24px' },
  '2xl': { width: '96px', height: '96px', fontSize: '24px' },
};

const statusSizes = {
  xs: { width: '8px', height: '8px', borderWidth: '2px' },
  sm: { width: '10px', height: '10px', borderWidth: '2px' },
  md: { width: '12px', height: '12px', borderWidth: '2px' },
  lg: { width: '14px', height: '14px', borderWidth: '3px' },
  xl: { width: '16px', height: '16px', borderWidth: '3px' },
  '2xl': { width: '18px', height: '18px', borderWidth: '3px' },
};

const statusColors = {
  online: 'var(--color-success)',
  offline: 'var(--color-neutral-400)',
  busy: 'var(--color-error)',
  away: 'var(--color-warning)',
};

const statusPositions = {
  'bottom-right': { bottom: 0, right: 0 },
  'bottom-left': { bottom: 0, left: 0 },
  'top-right': { top: 0, right: 0 },
  'top-left': { top: 0, left: 0 },
};

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  bordered?: boolean;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback, size = 'md', shape = 'circle', status, statusPosition = 'bottom-right', bordered = false, ...props }, ref) => {
    const sizeStyle = sizeStyles[size];
    const statusSize = statusSizes[size];

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const fallbackContent = fallback || (alt ? getInitials(alt) : '?');

    return (
      <motion.div
        ref={ref}
        style={{
          width: sizeStyles[size].width,
          height: sizeStyles[size].height,
          borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
          overflow: 'hidden',
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-neutral-200)',
          color: 'var(--color-text-muted)',
          fontSize: sizeStyles[size].fontSize,
          fontWeight: 600,
          flexShrink: 0,
          border: bordered ? '2px solid var(--color-border-main)' : 'none',
        } as React.CSSProperties}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {src ? (
          <img
            src={src}
            alt={alt || fallback || 'Avatar'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
            }}
          />
        ) : (
          <span>{fallbackContent}</span>
        )}
        {status && (
          <motion.div
            style={{
              position: 'absolute',
              ...statusSizes[size],
              ...statusPositions[statusPosition],
              backgroundColor: statusColors[status],
              border: '2px solid var(--color-bg-primary)',
              borderRadius: '50%',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
        {bordered && (
          <div
            style={{
              position: 'absolute',
              inset: -2,
              borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
              border: '2px solid var(--color-border-main)',
              pointerEvents: 'none',
            }}
          />
        )}
      </motion.div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
export type { AvatarProps };