import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface TabsProps extends HTMLMotionProps<'div'> {
  /** Tab items */
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  /** Active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onChange: (tabId: string) => void;
  /** Tab variant */
  variant?: 'line' | 'enclosed' | 'soft' | 'pills';
  /** Tab size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

const variantStyles = {
  line: {
    tab: { borderBottom: '2px solid transparent', paddingBottom: 'calc(var(--space-md) - 2px)' },
    activeTab: { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: 600 },
  },
  enclosed: {
    tab: { border: '1px solid var(--color-border-main)', borderRadius: 'var(--radius-md)', marginRight: 'var(--space-sm)' },
    activeTab: { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' },
  },
  soft: {
    tab: { borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)' },
    activeTab: { background: 'var(--color-primary-100)', color: 'var(--color-primary)', fontWeight: 600 },
  },
  pills: {
    tab: { borderRadius: 'var(--radius-full)', padding: 'var(--space-xs) var(--space-lg)' },
    activeTab: { background: 'var(--color-primary)', color: 'white' },
  },
};

const sizeStyles = {
  sm: { fontSize: '12px', padding: '6px 12px' },
  md: { fontSize: '14px', padding: '10px 20px' },
  lg: { fontSize: '16px', padding: '14px 28px' },
};

interface TabsProps extends HTMLMotionProps<'div'> {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'soft' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, activeTab, onChange, variant = 'line', size = 'md', fullWidth = false, orientation = 'horizontal', ...props }, ref) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
      <div ref={ref} style={{ width: fullWidth ? '100%' : 'auto' }} {...props}>
        <div
          role="tablist"
          aria-orientation={orientation}
          style={{
            display: 'flex',
            flexDirection: orientation === 'horizontal' ? 'row' : 'column',
            gap: 'var(--space-sm)',
            width: fullWidth ? '100%' : 'auto',
            borderBottom: variant === 'line' ? '1px solid var(--color-border-main)' : 'none',
            paddingBottom: variant === 'line' ? 'calc(var(--space-md) - 2px)' : 0,
          }}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              style={{
                ...sizeStyles[size],
                ...variantStyles[variant].tab,
                background: 'transparent',
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                opacity: tab.disabled ? 0.5 : 1,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: tab.disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                fontWeight: 500,
                transition: 'all var(--motion-fast) var(--ease-standard)',
              }}
              whileHover={!tab.disabled ? { backgroundColor: 'var(--color-neutral-100)' } : undefined}
              whileTap={!tab.disabled ? { scale: 0.98 } : undefined}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-disabled={tab.disabled}
            >
              {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${activeTab}`} style={{ marginTop: 'var(--space-lg)' }}>
          {/* Tab panels would be rendered here based on activeTab */}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;

const variantStyles = {
  line: {
    tab: { borderBottom: '2px solid transparent', paddingBottom: 'calc(var(--space-md) - 2px)' },
    activeTab: { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: 600 },
  },
  enclosed: {
    tab: { border: '1px solid var(--color-border-main)', borderRadius: 'var(--radius-md)', marginRight: 'var(--space-sm)' },
    activeTab: { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' },
  },
  soft: {
    tab: { borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)' },
    activeTab: { background: 'var(--color-primary-100)', color: 'var(--color-primary)', fontWeight: 600 },
  },
  pills: {
    tab: { borderRadius: 'var(--radius-full)', padding: 'var(--space-xs) var(--space-lg)' },
    activeTab: { background: 'var(--color-primary)', color: 'white' },
  },
} as const;

const sizeStyles = {
  sm: { fontSize: '12px', padding: '6px 12px' },
  md: { fontSize: '14px', padding: '10px 20px' },
  lg: { fontSize: '16px', padding: '14px 28px' },
};

const variantStyles = {
  line: {
    tab: { borderBottom: '2px solid transparent', paddingBottom: 'calc(var(--space-md) - 2px)' },
    activeTab: { borderBottomColor: 'var(--color-primary)', color: 'var(--color-primary)', fontWeight: 600 },
  },
  enclosed: {
    tab: { border: '1px solid var(--color-border-main)', borderRadius: 'var(--radius-md)', marginRight: 'var(--space-sm)' },
    activeTab: { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' },
  },
  soft: {
    tab: { borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)' },
    activeTab: { background: 'var(--color-primary-100)', color: 'var(--color-primary)', fontWeight: 600 },
  },
  pills: {
    tab: { borderRadius: 'var(--radius-full)', padding: 'var(--space-xs) var(--space-lg)' },
    activeTab: { background: 'var(--color-primary)', color: 'white' },
  },
} as const;

const sizeStyles = {
  sm: { fontSize: '12px', padding: '6px 12px' },
  md: { fontSize: '14px', padding: '10px 20px' },
  lg: { fontSize: '16px', padding: '14px 28px' },
};

export interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'line' | 'enclosed' | 'soft' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, activeTab, onChange, variant = 'line', size = 'md', fullWidth = false, orientation = 'horizontal', ...props }, ref) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];

    return (
      <div ref={ref} {...props}>
        <div
          role="tablist"
          aria-orientation={orientation}
          style={{
            display: 'flex',
            flexDirection: orientation === 'horizontal' ? 'row' : 'column',
            gap: 'var(--space-sm)',
            width: fullWidth ? '100%' : 'auto',
            borderBottom: variant === 'line' ? '1px solid var(--color-border-main)' : 'none',
            paddingBottom: variant === 'line' ? 'calc(var(--space-md) - 2px)' : 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              style={{
                ...sizeStyles[size],
                ...variantStyles[variant].tab,
                background: 'transparent',
                border: 'none',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
              onClick={() => !tab.disabled && onChange(tab.id)}
            >
              {tab.icon && <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${activeTab}`} style={{ marginTop: 'var(--space-lg)' }}>
          {/* Tab panels would be rendered here based on activeTab */}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;