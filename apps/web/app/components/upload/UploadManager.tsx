'use client';

import { useCallback } from 'react';
import { useUpload, UploadConfig, UploadFile } from '@/app/hooks/useUpload';
import FileDropzone from './FileDropzone';
import UploadItem from './UploadItem';
import UploadPreview from './UploadPreview';

interface UploadManagerProps {
  config: UploadConfig;
  title?: string;
  description?: string;
  showPreview?: boolean;
  className?: string;
}

export default function UploadManager({
  config,
  title = 'رفع ملفات',
  description,
  showPreview = true,
  className = '',
}: UploadManagerProps) {
  const {
    files,
    addFiles,
    removeFile,
    cancelFile,
    retryFile,
    clearCompleted,
    isUploading,
  } = useUpload(config);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    addFiles(newFiles);
  }, [addFiles]);

  const pendingFiles = files.filter((f) => f.status !== 'success');
  const completedFiles = files.filter((f) => f.status === 'success');

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <div>
        <h3 style={{ marginBottom: 'var(--space-xs)' }}>{title}</h3>
        {description && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{description}</p>}
      </div>

      <FileDropzone
        onFilesSelected={handleFilesSelected}
        accept={config.accept}
        multiple={config.multiple}
        disabled={isUploading}
      />

      {pendingFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {pendingFiles.map((file) => (
            <UploadItem
              key={file.id}
              file={file}
              onCancel={cancelFile}
              onRetry={retryFile}
              onRemove={removeFile}
            />
          ))}
        </div>
      )}

      {showPreview && (
        <UploadPreview files={files} onRemove={removeFile} />
      )}

      {completedFiles.length > 0 && (
        <div style={{ padding: 'var(--space-md)', background: '#10b98110', borderRadius: 'var(--radius-card)', border: '1px solid #10b98130' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              <CheckIcon size={18} /> تم رفع {completedFiles.length} ملف بنجاح
            </span>
            <button onClick={clearCompleted} style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
              مسح القائمة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
}

function XIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}