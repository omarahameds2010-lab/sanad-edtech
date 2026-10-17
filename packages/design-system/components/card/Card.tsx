import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  image?: {
    src: string;
    alt: string;
    position?: 'top' | 'bottom';
  };
  padding?: 'none' | 'sm' | 'md' | 'lg';
  subject?: 'math' | 'physics' | 'arabic' | 'english' | 'chemistry' | 'computer-science';
  arabicRhythmStrip?: boolean;
  arabicRhythmStripLabel?: string;
  rhythmStripLabel?: string;
  disabled?: boolean;
}

const subjectMotifChars: Record<string, string> = {
  math: '⊞',
  physics: '∼',
  arabic: '✎',
  english: '"',
  chemistry: '●',
  'computer-science': '◈',
};

const subjectMotifColors: Record<string, string> = {
  math: 'var(--color-action)',
  physics: 'var(--color-action)',
  arabic: 'var(--color-action)',
  english: 'var(--color-action)',
  chemistry: 'var(--color-action)',
  'computer-science': 'var(--color-action)',
};

const subjectRhythmStripHeight: Record<string, number> = {
  math: 48,
  physics: 48,
  arabic: 64,
  english: 48,
  chemistry: 48,
  'computer-science': 48,
};

const subjectA2BandOffset: Record<string, string> = {
  math: '-24px',
  physics: '-24px',
  arabic: '-24px',
  english: '-24px',
  chemistry: '-24px',
  'computer-science': '-24px',
};

const subjectBandHeight: Record<string, string> = {
  math: '96px',
  physics: '96px',
  arabic: '96px',
  english: '96px',
  chemistry: '96px',
  'computer-science': '96px',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    size = 'md',
    hoverable = false,
    clickable = false,
    header,
    footer,
    image,
    padding = 'md',
    subject,
    arabicRhythmStrip = false,
    arabicRhythmStripLabel,
    rhythmStripLabel,
    disabled = false,
    onClick,
    style,
    ...props
  }, ref) => {
    const variantStyles = {
      default: { background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-main)' },
      outlined: { background: 'var(--color-surface-primary)', border: '2px solid var(--color-border-main)' },
      elevated: { background: 'var(--color-surface-primary)', border: 'none', boxShadow: 'var(--shadow-lg)' },
      filled: { background: 'var(--color-surface-secondary)', border: 'none' },
    };

    const sizeStyles = {
      sm: { borderRadius: 'var(--radius-md)' },
      md: { borderRadius: 'var(--radius-lg)' },
      lg: { borderRadius: 'var(--radius-xl)' },
    };

    const paddingStyles = {
      none: { padding: 0 },
      sm: { padding: '8px' },
      md: { padding: '16px' },
      lg: { padding: '24px' },
    };

    const isArabic = subject === 'arabic';
    const rhythmStrip = arabicRhythmStrip || isArabic;
    const rhythmStripLabelValue = arabicRhythmStripLabel || rhythmStripLabel || (isArabic ? 'A2' : undefined);

    const arabicRhythmStripStyle: React.CSSProperties = {
      height: subjectRhythmStripHeight[subject as keyof typeof subjectRhythmStripHeight] || 64,
      background: 'var(--color-surface-primary)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      margin: subjectA2BandOffset[subject as keyof typeof subjectA2BandOffset] || '-24px -24px 16px -24px',
      position: 'relative' as const,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      ...(isArabic && {
        background: 'var(--color-surface-primary)',
        border: '1px solid var(--color-border-main)',
      }),
    };

    const subjectBandStyle: React.CSSProperties = {
      height: subjectBandHeight[subject as keyof typeof subjectBandHeight] || '96px',
      background: 'var(--color-surface-primary)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      margin: subjectA2BandOffset[subject as keyof typeof subjectA2BandOffset] || '-24px -24px 16px -24px',
      position: 'relative' as const,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
    };

    const motifChar = subjectMotifChars[subject as keyof typeof subjectMotifChars] || '⊞';
    const motifColor = subjectMotifColors[subject as keyof typeof subjectMotifColors] || 'var(--color-action)';

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      if (onClick) onClick(e);
    };

    const computedStyle: React.CSSProperties = {
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...paddingStyles[padding],
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : (clickable || onClick ? 'pointer' : 'default'),
      transition: 'all 0.2s ease-out',
      ...style
    };

    return (
      <div
        ref={ref}
        style={computedStyle}
        onClick={handleCardClick}
        {...props}
      >
        {image && image.position !== 'bottom' && (
          <img
            src={image.src}
            alt={image.alt}
            style={{ width: '100%', height: 'auto', borderRadius: 'inherit', margin: '-16px -16px 16px -16px', objectFit: 'cover' }}
          />
        )}
        {header && <div style={{ marginBottom: '12px' }}>{header}</div>}
        
        {rhythmStrip && (
          <div style={arabicRhythmStripStyle}>
            <span style={{ color: motifColor, fontSize: '24px', marginRight: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {motifChar}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {rhythmStripLabelValue}
            </span>
          </div>
        )}

        {subject && !rhythmStrip && (
          <div style={subjectBandStyle}>
            <span style={{ color: motifColor, fontSize: '20px', marginRight: '12px' }}>{motifChar}</span>
          </div>
        )}

        <div className="lp-card-content">{children}</div>

        {image && image.position === 'bottom' && (
          <img
            src={image.src}
            alt={image.alt}
            style={{ width: '100%', height: 'auto', borderRadius: 'inherit', marginTop: '16px', objectFit: 'cover' }}
          />
        )}
        {footer && <div style={{ marginTop: '12px' }}>{footer}</div>}
      </div>
    );
  }
);

Card.displayName = 'Card';
