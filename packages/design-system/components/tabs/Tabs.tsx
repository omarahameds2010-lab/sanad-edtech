import * as React from 'react';

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
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
} as const;

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ tabs, activeTab, onChange, variant = 'line', size = 'md', fullWidth = false, orientation = 'horizontal', ...props }, ref) => {
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
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const currentVariantStyles = variantStyles[variant];
            
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onChange(tab.id)}
                style={{
                  ...sizeStyles[size],
                  ...currentVariantStyles.tab,
                  ...(isActive ? currentVariantStyles.activeTab : {}),
                  background: 'transparent',
                  border: 'none',
                  cursor: tab.disabled ? 'not-allowed' : 'pointer',
                  opacity: tab.disabled ? 0.5 : 1,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: tab.disabled 
                    ? 'var(--color-text-muted)' 
                    : (isActive ? 'var(--color-primary)' : 'var(--color-text-primary)'),
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--motion-fast) var(--ease-standard)',
                }}
              >
                {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id={`panel-${activeTab}`} style={{ marginTop: 'var(--space-lg)' }}>
          {/* Tab panels are dynamically tracking activeTab context */}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';
