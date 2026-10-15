'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth';
import { api, ApiError } from '@/app/lib/api';

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

type SavePhase = 'idle' | 'saving' | 'publishing' | 'done' | 'error';

export default function AssignmentLessonEditor({
  lessonId,
  initialData = {},
}: AssignmentLessonEditorProps) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: initialData.title || '',
    instructions: initialData.instructions || '',
    timerMinutes: initialData.timerMinutes ?? 300,
    maxAttempts: initialData.maxAttempts ?? 1,
    passingScore: initialData.passingScore ?? 0,
    allowLateSubmission: initialData.allowLateSubmission ?? true,
  });
  const [phase, setPhase] = useState<SavePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSaveAndPublish() {
    if (!token) {
      setError('سجّل الدخول أولًا لحفظ الواجب.');
      setPhase('error');
      return;
    }
    if (form.title.trim() === '') {
      setError('عنوان الواجب مطلوب.');
      setPhase('error');
      return;
    }
    setError(null);
    try {
      setPhase('saving');
      const created = await api.createAssignment(token, lessonId, {
        title: form.title.trim(),
        instructions: form.instructions.trim() === '' ? undefined : form.instructions.trim(),
        timerMinutes: Number(form.timerMinutes),
        maxAttempts: Number(form.maxAttempts),
        passingScore: Number(form.passingScore),
        allowLateSubmission: form.allowLateSubmission,
      });
      setPhase('publishing');
      await api.publishAssignment(token, created.id);
      setSavedId(created.id);
      setPhase('done');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('هذا الدرس مرتبط بواجب بالفعل — عدّل الواجب الحالي بدل إنشاء جديد.');
      } else {
        setError(e instanceof ApiError ? e.message : 'تعذر حفظ الواجب');
      }
      setPhase('error');
    }
  }

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا لحفظ الواجب. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

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

      {phase === 'error' && error && (
        <p role="alert" style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>
          {error}
        </p>
      )}

      {phase === 'done' && savedId ? (
        <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-control)', background: '#10b98115', border: '1px solid #10b98140' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>تم إنشاء الواجب ونشره بنجاح ✅</p>
          <Link href={`/teacher/assignments/${savedId}`}>فتح صفحة التصحيح والمتابعة</Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void handleSaveAndPublish()}
          disabled={phase === 'saving' || phase === 'publishing'}
          style={{ background: '#10b981', color: 'white', fontWeight: 700, justifySelf: 'start' }}
        >
          {phase === 'saving' && 'جاري إنشاء الواجب…'}
          {phase === 'publishing' && 'جاري النشر…'}
          {(phase === 'idle' || phase === 'error') && 'حفظ ونشر الواجب'}
        </button>
      )}
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