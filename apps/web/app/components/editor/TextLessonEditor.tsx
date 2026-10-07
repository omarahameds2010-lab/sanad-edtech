'use client';

import { useState } from 'react';

interface TextLessonEditorProps {
  initialData?: { title?: string; content?: string };
}

export default function TextLessonEditor({ initialData = {} }: TextLessonEditorProps) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    content: initialData.content || '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <h3>محتوى الدرس</h3>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          عنوان الدرس *
        </span>
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          style={inputStyle}
          placeholder="مثال: مقدمة في الجبر الخطي"
        />
      </label>

      <div>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          المحتوى
        </span>
        <textarea
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          placeholder="اكتب محتوى الدرس هنا..."
          style={{ ...inputStyle, minHeight: 200, resize: 'vertical', fontFamily: 'inherit' }}
        />
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