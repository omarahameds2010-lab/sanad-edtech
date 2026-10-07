'use client';

import { useState } from 'react';

interface ExamLessonEditorProps {
  lessonId: string;
  initialData?: {
    title?: string;
    timerMinutes?: number;
    passingScore?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    questions?: any[];
  };
}

export default function ExamLessonEditor({ initialData = {} }: ExamLessonEditorProps) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    timerMinutes: initialData.timerMinutes ?? 70,
    passingScore: initialData.passingScore ?? 60,
    maxAttempts: initialData.maxAttempts ?? 1,
    shuffleQuestions: initialData.shuffleQuestions ?? false,
  });

  const [questions, setQuestions] = useState<any[]>(initialData.questions || []);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const addQuestion = () => {
    setQuestions((qs) => [...qs, { id: `q${Date.now()}`, text: '', points: 10 }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 'var(--space-lg)' }}>
      <h3>إعدادات الاختبار</h3>

      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
          عنوان الاختبار *
        </span>
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          style={inputStyle}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            المدة (دقائق)
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
            درجة النجاح (%)
          </span>
          <input
            type="number"
            value={form.passingScore}
            onChange={(e) => update('passingScore', Number(e.target.value))}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            المحاولات
          </span>
          <input
            type="number"
            value={form.maxAttempts}
            onChange={(e) => update('maxAttempts', Number(e.target.value))}
            style={inputStyle}
          />
        </label>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <input
          type="checkbox"
          checked={form.shuffleQuestions}
          onChange={(e) => update('shuffleQuestions', e.target.checked)}
        />
        <span>خلط ترتيب الأسئلة</span>
      </label>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h4 style={{ margin: 0 }}>الأسئلة ({questions.length})</h4>
          <button onClick={addQuestion} style={{ fontSize: 13 }}>
            + إضافة سؤال
          </button>
        </div>

        {questions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            لم تتم إضافة أسئلة بعد. أضف أول سؤال للبدء.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {questions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>سؤال {index + 1}</span>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    style={{ padding: '2px 8px', fontSize: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                  >
                    حذف
                  </button>
                </div>
                <input
                  value={question.text}
                  onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                  placeholder="نص السؤال"
                  style={inputStyle}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', fontSize: 13 }}>
                  الدرجة:
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.id, 'points', Number(e.target.value))}
                    style={{ ...inputStyle, width: 70 }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--bg-base)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 14,
};