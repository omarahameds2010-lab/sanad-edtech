'use client';

import { SaveStatus } from '@/app/hooks/useAutosave';

interface LessonEditorShellProps {
  breadcrumb: { course: string; section: string; lesson: string };
  lessonType: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  saveError?: string | null;
  onSave: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  children: React.ReactNode;
  settingsPanel?: React.ReactNode;
}

const statusLabels: Record<SaveStatus, { text: string; color: string }> = {
  idle: { text: '', color: 'var(--text-muted)' },
  dirty: { text: 'تغييرات غير محفوظة', color: '#f59e0b' },
  saving: { text: 'جاري الحفظ...', color: '#3b82f6' },
  saved: { text: 'تم الحفظ', color: '#10b981' },
  error: { text: 'فشل الحفظ', color: '#ef4444' },
};

export default function LessonEditorShell({
  breadcrumb,
  lessonType,
  saveStatus,
  lastSavedAt,
  saveError,
  onSave,
  onPreview,
  onPublish,
  children,
  settingsPanel,
}: LessonEditorShellProps) {
  const status = statusLabels[saveStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
          paddingBottom: 'var(--space-md)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }} aria-label="breadcrumb">
            {breadcrumb.course} › {breadcrumb.section} › {breadcrumb.lesson}
          </nav>
          <h1 style={{ margin: 0 }}>{breadcrumb.lesson}</h1>
          <div style={{ fontSize: 12, color: status.color, minHeight: 18 }}>
            {status.text}
            {saveStatus === 'saved' && lastSavedAt && (
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}
                — {lastSavedAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {saveStatus === 'error' && saveError && (
              <span style={{ color: '#ef4444' }}> — {saveError}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button
            onClick={onSave}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            حفظ
          </button>
          {onPreview && (
            <button
              onClick={onPreview}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              معاينة
            </button>
          )}
          {onPublish && <button onClick={onPublish}>نشر</button>}
        </div>
      </div>

      {/* Layout: Editor + Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: settingsPanel ? '1fr 280px' : '1fr', gap: 'var(--space-lg)' }}>
        <div>{children}</div>
        {settingsPanel && <aside>{settingsPanel}</aside>}
      </div>
    </div>
  );
}