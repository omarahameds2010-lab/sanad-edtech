'use client';

import { useState } from 'react';
import VideoUploader from '@/app/components/upload/VideoUploader';
import ThumbnailUploader from '@/app/components/upload/ThumbnailUploader';

interface VideoLessonEditorProps {
  lessonId: string;
  initialData?: {
    title?: string;
    description?: string;
    videoId?: string;
    duration?: number;
    visibility?: string;
    allowDownload?: boolean;
  };
  onSave?: (data: any) => Promise<void>;
  saveStatus?: any;
  lastSavedAt?: Date | null;
  onSaveNow?: () => void;
}

export default function VideoLessonEditor({
  lessonId,
  initialData = {},
}: VideoLessonEditorProps) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    visibility: initialData.visibility || 'ENROLLED',
    allowDownload: initialData.allowDownload ?? false,
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>معلومات الدرس</h3>
        <label style={{ display: 'block', marginBottom: 'var(--space-md)' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            عنوان الدرس *
          </span>
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            style={inputStyle}
            placeholder="مثال: مقدمة في قوانين نيوتن"
          />
        </label>

        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            وصف الدرس
          </span>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
            placeholder="اشرح للطالب ما سيتعلمه في هذا الدرس"
          />
        </label>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>الفيديو</h3>
        {initialData.videoId ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500 }}>فيديو مرفوع</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                المدة: {initialData.duration ? formatDuration(initialData.duration) : '—'}
              </div>
            </div>
            <button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              استبدال
            </button>
          </div>
        ) : (
          <VideoUploader lessonId={lessonId} />
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>صورة مصغرة</h3>
        <ThumbnailUploader lessonId={lessonId} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 14,
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}