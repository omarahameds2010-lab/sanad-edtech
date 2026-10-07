'use client';

import { useState } from 'react';
import ResourceUploader from '@/app/components/upload/ResourceUploader';
import Link from 'next/link';

interface ResourceLessonEditorProps {
  lessonId: string;
  initialData?: { title?: string; description?: string; resources?: any[] };
}

export default function ResourceLessonEditor({ lessonId, initialData = {} }: ResourceLessonEditorProps) {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [resources, setResources] = useState<any[]>(initialData.resources || []);

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>معلومات الدرس</h3>
        <label style={{ display: 'block', marginBottom: 'var(--space-md)' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            عنوان الدرس *
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            placeholder="مثال: ملفات مرجعية للوحدة الأولى"
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            وصف الدرس
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </label>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>الموارد</h3>
        {resources.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            لا توجد موارد بعد. ارفع أول ملف.
          </p>
        )}
        {resources.map((resource) => (
          <div
            key={resource.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-sm) 0',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <FileTypeIcon type={resource.type} />
              <div>
                <div style={{ fontWeight: 500 }}>{resource.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {resource.type} · {resource.size ? formatBytes(resource.size) : '—'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Link href={`/api/teacher/resources/${resource.id}/access-url`} style={{ fontSize: 12 }}>
                رابط
              </Link>
              <button
                onClick={() => setResources((r) => r.filter((x) => x.id !== resource.id))}
                style={{ padding: '2px 10px', fontSize: 12, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                إزالة
              </button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 'var(--space-md)' }}>
          <ResourceUploader
            lessonId={lessonId}
            onComplete={(_file, response) => {
              setResources((r) => [...r, response]);
            }}
          />
        </div>
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

function FileTypeIcon({ type }: { type: string }) {
  const color = type === 'PDF' ? '#ef4444' : type === 'LINK' ? '#3b82f6' : '#10b981';
  return (
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-control)',
        background: `${color}20`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {type === 'PDF' ? 'PDF' : type === 'LINK' ? 'URL' : 'FILE'}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}