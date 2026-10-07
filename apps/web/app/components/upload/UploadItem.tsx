'use client';

import Image from 'next/image';
import { UploadFile } from '@/app/hooks/useUpload';
import UploadProgress from './UploadProgress';

interface UploadItemProps {
  file: UploadFile;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  showPreview?: boolean;
}

export default function UploadItem({ file, onCancel, onRetry, onRemove, showPreview = true }: UploadItemProps) {
  const statusConfig: Record<UploadFile['status'], { label: string; color: string; icon: React.ReactNode }> = {
    idle: { label: 'في الانتظار', color: 'var(--text-muted)', icon: <ClockIcon /> },
    selected: { label: 'محدد', color: 'var(--text-muted)', icon: <FileIcon /> },
    validating: { label: 'جاري التحقق', color: '#3b82f6', icon: <LoaderIcon /> },
    uploading: { label: 'جاري الرفع', color: '#3b82f6', icon: <LoaderIcon /> },
    processing: { label: 'جاري المعالجة', color: '#f59e0b', icon: <CpuIcon /> },
    success: { label: 'تم بنجاح', color: '#10b981', icon: <CheckIcon /> },
    error: { label: 'فشل', color: '#ef4444', icon: <AlertIcon /> },
    cancelled: { label: 'ملغي', color: 'var(--text-muted)', icon: <XIcon /> },
  };

  const { label, color, icon } = statusConfig[file.status];

  return (
    <div className="card" style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', position: 'relative' }}>
      {file.preview && showPreview && (
        <Image src={file.preview} alt={file.file.name} width={64} height={64} style={{ borderRadius: 'var(--radius-control)', objectFit: 'cover' }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
          <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {file.file.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatBytes(file.file.size)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: 13, fontWeight: 500 }}>
            {icon} {statusConfig[file.status].label}
          </span>
          {file.status === 'uploading' && (
            <UploadProgress progress={file.progress} />
          )}
        </div>

        {file.error && (
          <p style={{ marginTop: 'var(--space-xs)', fontSize: 12, color: '#ef4444' }}>{file.error}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        {file.status === 'uploading' || file.status === 'validating' ? (
          <button onClick={() => onCancel(file.id)} style={{ padding: '4px 12px', fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-control)' }}>
            إلغاء
          </button>
        ) : file.status === 'error' || file.status === 'cancelled' ? (
          <button onClick={() => onRetry(file.id)} style={{ padding: '4px 12px', fontSize: 12, background: 'var(--color-action)', color: 'var(--bg-base)', border: 'none', borderRadius: 'var(--radius-control)' }}>
            إعادة المحاولة
          </button>
        ) : file.status !== 'success' ? (
          <button onClick={() => onCancel(file.id)} style={{ padding: '4px 12px', fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-control)' }}>
            إلغاء
          </button>
        ) : null}

        <button onClick={() => onRemove(file.id)} style={{ padding: 4, color: 'var(--text-muted)', background: 'transparent', border: 'none' }} aria-label="إزالة">
          <XIcon size={18} />
        </button>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Icons
function ClockIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function FileIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function LoaderIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>; }
function CpuIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/></svg>; }
function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>; }
function AlertIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function XIcon({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }