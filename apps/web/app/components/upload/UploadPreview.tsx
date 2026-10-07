'use client';

interface UploadPreviewProps {
  files: Array<{
    id: string;
    file: File;
    preview?: string;
    status: string;
  }>;
  onRemove: (id: string) => void;
}

export default function UploadPreview({ files, onRemove }: UploadPreviewProps) {
  if (files.length === 0) return null;

  const imageFiles = files.filter((f) => f.preview);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 'var(--space-sm)' }}>
      {imageFiles.map((file) => (
        <div key={file.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-control)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <img src={file.preview} alt={file.file.name} width={100} height={100} style={{ objectFit: 'cover' }} />
          <button
            onClick={() => onRemove(file.id)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function XIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }