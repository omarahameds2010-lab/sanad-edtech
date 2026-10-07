'use client';

import { useCallback, useState } from 'react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number;
}

export default function FileDropzone({
  onFilesSelected,
  accept,
  multiple = false,
  disabled = false,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [disabled, onFilesSelected]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    e.target.value = '';
  }, [onFilesSelected]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: '2px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-xl)',
        textAlign: 'center',
        background: isDragOver ? 'var(--color-action)10' : 'var(--bg-surface)',
        borderColor: isDragOver ? 'var(--color-action)' : 'var(--border-subtle)',
        transition: 'all var(--motion-fast) var(--ease-standard)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div style={{ color: isDragOver ? 'var(--color-action)' : 'var(--text-primary)' }}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ marginBottom: 'var(--space-sm)' }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p style={{ margin: 0, fontWeight: 500 }}>
          {isDragOver ? 'أفلِت الملفات هنا' : 'اسحب وأفلِت أو اضغط للاختيار'}
        </p>
        <p style={{ margin: 'var(--space-xs) 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          الصيغ المقبولة: {accept}
        </p>
      </div>
    </div>
  );
}

import { useRef } from 'react';