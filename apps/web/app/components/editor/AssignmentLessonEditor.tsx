'use client';

import { useState } from 'react';

interface AssignmentLessonEditorProps {
  lessonId: string;
  initialData?: {
    title?: string;
    instructions?: string;
    timerMinutes?: number;
    maxAttempts?: number;
    passingScore?: number;
    allowLateSubmission?: boolean;
  };
}

export default function AssignmentLessonEditor({ initialData = {} }: AssignmentLessonEditorProps) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    instructions: initialData.instructions || '',
    timerMinutes: initialData.timerMinutes ?? 300,
    maxAttempts: initialData.maxAttempts ?? 1,
    passingScore: initialData.passingScore ?? 0,
    allowLateSubmission: initialData.allowLateSubmission ?? true,
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
      <h3>تعليمات الواجب</h3>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          عنوان الواجب *
        </span>
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          style={inputStyle}
        />
      </label>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          التعليمات
        </span>
        <textarea
          value={form.instructions}
          onChange={(e) => update('instructions', e.target.value)}
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          placeholder="اشرح للطالب ما يجب عليه فعله"
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            الوقت (دقائق)
          </span>
          <input
            type="number"
            value={form.timerMinutes}
            onChange={(e) => update('timerMinutes', Number(e.target.value))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            الحد الأقصى للمحاولات
          </span>
          <input
            type="number"
            value={form.maxAttempts}
            onChange={(e) => update('maxAttempts', Number(e.target.value))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            درجة النجاح (%)
          </span>
          <input
            type="number"
            value={form.passingScore}
            onChange={(e) => update('passingScore', Number(e.target.value))}
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <input
          type="checkbox"
          checked={form.allowLateSubmission}
          onChange={(e) => update('allowLateSubmission', e.target.checked)}
        />
        <span>السماح بالتسليم المتأخر</span>
      </label>
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