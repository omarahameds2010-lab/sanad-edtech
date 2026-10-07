'use client';

interface UploadProgressProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function UploadProgress({ progress, size = 'md' }: UploadProgressProps) {
  const heights = { sm: 4, md: 6, lg: 10 };
  const width = Math.min(100, Math.max(0, progress));

  return (
    <div
      style={{
        width: 120,
        height: heights[size],
        background: 'var(--bg-base)',
        borderRadius: 999,
        overflow: 'hidden',
        flexShrink: 0,
      }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          background: 'var(--color-action)',
          borderRadius: 999,
          transition: 'width var(--motion-fast) var(--ease-standard)',
        }}
      />
    </div>
  );
}