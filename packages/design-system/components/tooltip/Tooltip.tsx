import { forwardRef, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Trigger element */
  children: React.ReactElement;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
  /** Delay before showing */
  openDelay?: number;
  /** Delay before hiding */
  closeDelay?: number;
  /** Distance from trigger */
  offset?: number;
  /** Show arrow */
  arrow?: boolean;
  /** Max width */
  maxWidth?: number;
}

const positionStyles = {
  top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
  bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
  left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
  right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
  'top-start': { bottom: '100%', left: 0, transform: 'none', marginBottom: '8px' },
  'top-end': { bottom: '100%', right: 0, transform: 'none', marginBottom: '8px' },
  'bottom-start': { top: '100%', left: 0, transform: 'none', marginTop: '8px' },
  'bottom-end': { top: '100%', right: 0, transform: 'none', marginTop: '8px' },
  'left-start': { right: '100%', top: 0, transform: 'none', marginRight: '8px' },
  'left-end': { right: '100%', bottom: 0, transform: 'none', marginRight: '8px' },
  'right-start': { left: '100%', top: 0, transform: 'none', marginLeft: '8px' },
  'right-end': { left: '100%', bottom: 0, transform: 'none', marginLeft: '8px' },
};

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
  openDelay?: number;
  closeDelay?: number;
  offset?: number;
  arrow?: boolean;
  maxWidth?: number;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, position = 'top', openDelay = 200, closeDelay = 100, offset = 8, arrow = true, maxWidth = 280 }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = window.setTimeout(() => setIsOpen(true), openDelay);
    };

    const hideTooltip = () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), closeDelay);
    };

    const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => showTooltip();
    const handleMouseLeave = () => hideTooltip();
    const handleFocus = () => showTooltip();
    const handleBlur = () => hideTooltip();

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const updatePosition = () => {
        const triggerRect = triggerRef.current?.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        if (!triggerRect || !tooltipRect) return;

        const positionStyle = positionStyles[position as keyof typeof positionStyles] || positionStyles.top;
        const offset = offset || 8;

        // Calculate position based on position prop
        // This is simplified - a full implementation would use a library like floating-ui
        // For now, we'll use basic positioning
      };

      if (isOpen) {
        updatePosition();
      }
    }, [isOpen, position, offset]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Simplified implementation for now
    const [isOpen, setIsOpen] = useState(false);

    const handleMouseEnter = () => {
      clearTimeout(closeTimeoutRef.current);
      openTimeoutRef.current = window.setTimeout(() => setIsOpen(true), openDelay || 200);
    };

    const handleMouseLeave = () => {
      clearTimeout(openTimeoutRef.current);
      closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), closeDelay || 100);
    };

    const handleFocus = () => setIsOpen(true);
    const handleBlur = () => hideTooltip();

    const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showTooltip = () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = window.setTimeout(() => setIsOpen(true), openDelay || 200);
    };

    const hideTooltip = () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), closeDelay || 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Simplified implementation - just show/hide on hover
    return (
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ display: 'inline-block' }}
        tabIndex={0}
      >
        {typeof children === 'object' && 'props' in children
          ? React.cloneElement(children as React.ReactElement, {
              ref: triggerRef,
              onMouseEnter: handleMouseEnter,
              onMouseLeave: handleMouseLeave,
              onFocus: handleFocus,
              onBlur: handleBlur,
              onKeyDown: handleKeyDown,
            })
          : children}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'ease-out' }}
              style={{
                position: 'fixed',
                zIndex: 9999,
                maxWidth: maxWidth || 280,
                padding: '8px 12px',
                background: 'var(--color-neutral-900)',
                color: 'var(--color-text-inverse)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                lineHeight: 1.4,
                boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'none',
                whiteSpace: 'normal',
              }}
            >
              {content}
              {arrow && (
                <div
                  style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid var(--color-neutral-900)',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;