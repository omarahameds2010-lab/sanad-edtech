'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/auth';
import { api, ApiError, type ExamQuestionType } from '@/app/lib/api';

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
  examId?: string;
}

interface OptionDraft {
  id: string;
  text: string;
}

interface QuestionDraft {
  localId: string;
  type: ExamQuestionType;
  text: string;
  points: number;
  options: OptionDraft[];
  correctOptionId: string | null;
}

type SavePhase =
  | 'idle'
  | 'saving-exam'
  | 'saving-questions'
  | 'publishing'
  | 'done'
  | 'error';

const TRUE_FALSE_OPTIONS: OptionDraft[] = [
  { id: 'true', text: 'صح' },
  { id: 'false', text: 'خطأ' },
];

let optionCounter = 0;
function newOptionId(): string {
  optionCounter += 1;
  return `opt-${Date.now().toString(36)}-${optionCounter}`;
}

export default function ExamLessonEditor({
  lessonId,
  initialData = {},
  examId: existingExamId,
}: ExamLessonEditorProps) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: initialData.title || '',
    timerMinutes: initialData.timerMinutes ?? 70,
    passingScore: initialData.passingScore ?? 60,
    maxAttempts: initialData.maxAttempts ?? 1,
    shuffleQuestions: initialData.shuffleQuestions ?? false,
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [phase, setPhase] = useState<SavePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savedExamId, setSavedExamId] = useState<string | null>(
    existingExamId ?? null,
  );

  const update = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateQuestion = (localId: string, patch: Partial<QuestionDraft>) =>
    setQuestions((qs) => qs.map((q) => (q.localId === localId ? { ...q, ...patch } : q)));

  const addQuestion = () => {
    setQuestions((qs) => [
      ...qs,
      {
        localId: `q-${Date.now().toString(36)}-${qs.length}`,
        type: 'MCQ',
        text: '',
        points: 10,
        options: [],
        correctOptionId: null,
      },
    ]);
  };

  const removeQuestion = (localId: string) => {
    setQuestions((qs) => qs.filter((q) => q.localId !== localId));
  };

  const setQuestionType = (localId: string, type: ExamQuestionType) => {
    setQuestions((qs) =>
      qs.map((q) =>
        q.localId === localId
          ? {
              ...q,
              type,
              options: type === 'TRUE_FALSE' ? [...TRUE_FALSE_OPTIONS] : type === 'MCQ' ? q.options : [],
              correctOptionId: type === 'TRUE_FALSE' ? q.correctOptionId : null,
            }
          : q,
      ),
    );
  };

  const addOption = (localId: string) => {
    setQuestions((qs) =>
      qs.map((q) =>
        q.localId === localId
          ? { ...q, options: [...q.options, { id: newOptionId(), text: '' }] }
          : q,
      ),
    );
  };

  const updateOption = (localId: string, optionId: string, text: string) => {
    setQuestions((qs) =>
      qs.map((q) =>
        q.localId === localId
          ? {
              ...q,
              options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
            }
          : q,
      ),
    );
  };

  const removeOption = (localId: string, optionId: string) => {
    setQuestions((qs) =>
      qs.map((q) =>
        q.localId === localId
          ? {
              ...q,
              options: q.options.filter((o) => o.id !== optionId),
              correctOptionId: q.correctOptionId === optionId ? null : q.correctOptionId,
            }
          : q,
      ),
    );
  };

  async function handleSaveAndPublish() {
    if (!token) {
      setError('سجّل الدخول أولًا لحفظ الاختبار.');
      setPhase('error');
      return;
    }
    if (form.title.trim() === '') {
      setError('عنوان الاختبار مطلوب.');
      setPhase('error');
      return;
    }
    setError(null);
    try {
      setPhase('saving-exam');
      const exam = await api.createExam(token, lessonId, {
        title: form.title.trim(),
        timerMinutes: Number(form.timerMinutes),
        passingScore: Number(form.passingScore),
        maxAttempts: Number(form.maxAttempts),
        shuffleQuestions: form.shuffleQuestions,
      });

      setPhase('saving-questions');
      for (let i = 0; i < questions.length; i += 1) {
        const q = questions[i];
        if (q.text.trim() === '') continue;
        const needsOptions = q.type === 'MCQ' || q.type === 'TRUE_FALSE';
        const options = needsOptions
          ? q.options.filter((o) => o.text.trim() !== '')
          : undefined;
        await api.addExamQuestion(token, exam.id, {
          type: q.type,
          text: q.text.trim(),
          points: Number(q.points) || 1,
          position: i,
          options: options?.map((o) => ({ id: o.id, text: o.text.trim() })),
          correctAnswer: q.correctOptionId ? { correctOptionId: q.correctOptionId } : undefined,
        });
      }

      setPhase('publishing');
      await api.publishExam(token, exam.id);
      setSavedExamId(exam.id);
      setPhase('done');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError('هذا الدرس مرتبط باختبار بالفعل — عدّل الاختبار الحالي بدل إنشاء جديد.');
      } else {
        setError(e instanceof ApiError ? e.message : 'تعذر حفظ الاختبار');
      }
      setPhase('error');
    }
  }

  if (!token) {
    return (
      <div className="card">
        <p>
          سجّل الدخول أولًا لحفظ الاختبار. <Link href="/login">تسجيل الدخول</Link>
        </p>
      </div>
    );
  }

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
          <button type="button" onClick={addQuestion} style={{ fontSize: 13 }}>
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
                key={question.localId}
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
                    type="button"
                    onClick={() => removeQuestion(question.localId)}
                    style={{ padding: '2px 8px', fontSize: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                  >
                    حذف
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <input
                    value={question.text}
                    onChange={(e) => updateQuestion(question.localId, { text: e.target.value })}
                    placeholder="نص السؤال"
                    style={inputStyle}
                  />
                  <select
                    value={question.type}
                    onChange={(e) => setQuestionType(question.localId, e.target.value as ExamQuestionType)}
                    style={inputStyle}
                    aria-label="نوع السؤال"
                  >
                    <option value="MCQ">اختيار من متعدد</option>
                    <option value="TRUE_FALSE">صح / خطأ</option>
                    <option value="SHORT_ANSWER">إجابة قصيرة</option>
                    <option value="ESSAY">مقالي</option>
                  </select>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.localId, { points: Number(e.target.value) })}
                    style={inputStyle}
                    aria-label="الدرجة"
                  />
                </div>

                {(question.type === 'MCQ' || question.type === 'TRUE_FALSE') && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {question.options.map((opt) => (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="radio"
                          name={`correct-${question.localId}`}
                          checked={question.correctOptionId === opt.id}
                          onChange={() => updateQuestion(question.localId, { correctOptionId: opt.id })}
                          aria-label="الإجابة الصحيحة"
                        />
                        <input
                          value={opt.text}
                          onChange={(e) => updateOption(question.localId, opt.id, e.target.value)}
                          placeholder="نص الاختيار"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        {question.type === 'MCQ' && (
                          <button
                            type="button"
                            onClick={() => removeOption(question.localId, opt.id)}
                            style={{ padding: '2px 8px', fontSize: 12, background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {question.type === 'MCQ' && (
                      <button
                        type="button"
                        onClick={() => addOption(question.localId)}
                        style={{ fontSize: 12, justifySelf: 'start' }}
                      >
                        + اختيار
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {phase === 'error' && error && (
        <p role="alert" style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>
          {error}
        </p>
      )}

      {phase === 'done' && savedExamId ? (
        <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-control)', background: '#10b98115', border: '1px solid #10b98140' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>تم إنشاء الاختبار ونشره بنجاح ✅</p>
          <Link href={`/teacher/exams/${savedExamId}`}>فتح صفحة التصحيح والمتابعة</Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void handleSaveAndPublish()}
          disabled={phase !== 'idle' && phase !== 'error'}
          style={{ background: '#10b981', color: 'white', fontWeight: 700 }}
        >
          {phase === 'saving-exam' && 'جاري إنشاء الاختبار…'}
          {phase === 'saving-questions' && 'جاري حفظ الأسئلة…'}
          {phase === 'publishing' && 'جاري النشر…'}
          {(phase === 'idle' || phase === 'error') && 'حفظ ونشر الاختبار'}
        </button>
      )}
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
