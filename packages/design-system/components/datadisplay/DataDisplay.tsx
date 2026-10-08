import { forwardRef } from 'react';
import { motion } from 'framer-motion';

export interface DataDisplayProps {
  data: Record<string, any>;
  variant?: 'default' | 'card' | 'list' | 'table' | 'inline';
  fields?: Array<{
    key: string;
    label: string;
    formatter?: (value: any) => React.ReactNode;
    hideIfEmpty?: boolean;
  }>;
  layout?: 'grid' | 'list' | 'dl' | 'inline';
  columns?: number;
  showLabels?: boolean;
  emptyMessage?: string;
}

const layoutStyles = {
  grid: { display: 'grid', gap: 'var(--space-lg)' },
  list: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' },
  dl: { display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' },
  inline: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' },
};

const columnStyles = {
  1: '1fr',
  2: 'repeat(2, 1fr)',
  3: 'repeat(3, 1fr)',
  4: 'repeat(4, 1fr)',
};

export interface DataDisplayProps {
  data: Record<string, any>;
  variant?: 'default' | 'card' | 'list' | 'table' | 'inline';
  fields?: Array<{
    key: string;
    label: string;
    formatter?: (value: any) => React.ReactNode;
    hideIfEmpty?: boolean;
  }>;
  layout?: 'grid' | 'list' | 'dl' | 'inline';
  columns?: number;
  showLabels?: boolean;
  emptyMessage?: string;
}

const DataDisplay = forwardRef<HTMLDivElement, DataDisplayProps>(
  ({ data, variant = 'default', fields, layout = 'grid', columns = 2, showLabels = true, emptyMessage = 'No data available', ...props }, ref) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {emptyMessage}
        </div>
      );
    }

    const fieldsToShow = fields || Object.keys(data).map(key => ({ key, label: key }));
    const dataEntries = fieldsToShow.map(field => ({
      key: field.key,
      label: field.label || field.key,
      value: data[field.key],
      formatter: field.formatter,
      hideIfEmpty: field.hideIfEmpty,
    })).filter(item => !item.hideIfEmpty || data[item.key] !== undefined && data[item.key] !== null && data[item.key] !== '');

    const layoutStyles = {
      grid: {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--space-lg)',
      },
      list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      },
      dl: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      },
      inline: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-md)',
        alignItems: 'center',
      },
    };

    const layoutStyle = layoutStyles[layout];

    return (
      <div ref={ref} style={{ ...props.style }} className={props.className}>
        {layout === 'grid' && (
          <div style={{ ...layoutStyle, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {dataEntries.map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {field.formatter ? field.formatter(data[field.key]) : data[field.key]}
                </span>
              </div>
            ))}
          </div>
        )}

        {layout === 'list' && (
          <div style={layoutStyle}>
            {dataEntries.map(field => (
              <div key={field.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-border-light)' }}>
                {showLabels && <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', minWidth: '140px', flexShrink: 0 }}>{field.label}</span>}
                <div style={{ flex: 1 }}>
                  {field.formatter ? field.formatter(data[field.key]) : data[field.key]}
                </div>
              </div>
            ))}
          </div>
        )}

        {layout === 'dl' && (
          <dl style={layoutStyle}>
            {dataEntries.map(field => (
              <>
                <dt style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </dt>
                <dd style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '14px' }}>
                  {field.formatter ? field.formatter(data[field.key]) : data[field.key]}
                </dd>
              </>
            ))}
          </dl>
        )}

        {layout === 'inline' && (
          <div style={layoutStyle}>
            {dataEntries.map(field => (
              <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', background: 'var(--color-neutral-100)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-full)', fontSize: '13px' }}>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '12px' }}>{field.label}:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {field.formatter ? field.formatter(data[field.key]) : data[field.key]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

DataDisplay.displayName = 'DataDisplay';

export { DataDisplay };
export type { DataDisplayProps };