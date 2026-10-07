'use client';

import { useState } from 'react';

const examAttempts = [
  {
    id: 'att1',
    studentName: 'عمر مصطفى',
    examTitle: 'اختبار: الهندسة التحليلية',
    attemptNumber: 1,
    status: 'SUBMITTED',
    startedAt: '2026-10-05T08:00:00Z',
    submittedAt: '2026-10-05T08:55:00Z',
    score: 78,
    passed: true,
    duration: 55,
    totalQuestions: 12,
    correctAnswers: 10,
    answers: [
      { question: 'ما هو ميل المستقيم y = 2x + 3؟', selected: '2', correct: true },
      { question: 'ما هو ميل المستقيم x = 5؟', selected: 'لا يوجد', correct: true },
      { question: 'احسب المسافة بين (1,2) و (4,6)', selected: '5', correct: true },
      { question: 'معادلة الدائرة بمركز (0,0) ونصف قطر 3', selected: 'x²+y²=9', correct: true },
      { question: 'منتصف القطعة بين (2,3) و (8,7)؟', selected: '(5,5)', correct: true },
    ],
  },
  {
    id: 'att2',
    studentName: 'سارة علي',
    examTitle: 'اختبار: الهندسة التحليلية',
    attemptNumber: 1,
    status: 'GRADED',
    startedAt: '2026-10-05T10:00:00Z',
    submittedAt: '2026-10-05T11:00:00Z',
    score: 92,
    passed: true,
    duration: 60,
    totalQuestions: 12,
    correctAnswers: 11,
    answers: [],
  },
  {
    id: 'att3',
    studentName: 'يوسف أحمد',
    examTitle: 'اختبار: الهندسة التحليلية',
    attemptNumber: 1,
    status: 'IN_PROGRESS',
    startedAt: '2026-10-06T14:00:00Z',
    submittedAt: undefined,
    score: undefined,
    passed: undefined,
    duration: undefined,
    totalQuestions: 12,
    correctAnswers: 0,
    answers: [],
  },
  {
    id: 'att4',
    studentName: 'مريم حسن',
    examTitle: 'اختبار: الهندسة التحليلية',
    attemptNumber: 1,
    status: 'SUBMITTED',
    startedAt: '2026-10-05T12:00:00Z',
    submittedAt: '2026-10-05T12:48:00Z',
    score: 55,
    passed: false,
    duration: 48,
    totalQuestions: 12,
    correctAnswers: 7,
    answers: [
      { question: 'ما هو ميل المستقيم y = 2x + 3؟', selected: '2', correct: true },
      { question: 'ما هو ميل المستقيم x = 5؟', selected: '5', correct: false },
      { question: 'احسب المسافة بين (1,2) و (4,6)', selected: '5', correct: true },
      { question: 'معادلة الدائرة بمركز (0,0) ونصف قطر 3', selected: 'x+y=9', correct: false },
      { question: 'منتصف القطعة بين (2,3) و (8,7)؟', selected: '(5,5)', correct: true },
    ],
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'مُسلم', color: '#3b82f6' },
  GRADED: { label: 'مُصحّح', color: '#10b981' },
  IN_PROGRESS: { label: 'جاري', color: '#f59e0b' },
  TIMED_OUT: { label: 'انتهى الوقت', color: '#ef4444' },
};

export default function ExamAttemptsPage() {
  const [selectedAttempt, setSelectedAttempt] = useState<typeof examAttempts[0] | null>(null);

  const stats = {
    total: examAttempts.length,
    completed: examAttempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'GRADED').length,
    passed: examAttempts.filter((a) => a.passed === true).length,
    failed: examAttempts.filter((a) => a.passed === false).length,
    inProgress: examAttempts.filter((a) => a.status === 'IN_PROGRESS').length,
  };

  return (
    <>
      <h1>محاولات الاختبار</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الإجمالي</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{stats.passed}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ناجح</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{stats.failed}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>راسب</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{stats.inProgress}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>جاري</div>
        </div>
      </div>

      {!selectedAttempt ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'right', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: 'var(--space-md)' }}>الطالب</th>
                <th style={{ padding: 'var(--space-md)' }}>الاختبار</th>
                <th style={{ padding: 'var(--space-md)' }}>المحاولة</th>
                <th style={{ padding: 'var(--space-md)' }}>الحالة</th>
                <th style={{ padding: 'var(--space-md)' }}>الدرجة</th>
                <th style={{ padding: 'var(--space-md)' }}>النتيجة</th>
                <th style={{ padding: 'var(--space-md)' }}>المدة</th>
                <th style={{ padding: 'var(--space-md)' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {examAttempts.map((att) => (
                <tr key={att.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: 'var(--space-md)', fontWeight: 600 }}>{att.studentName}</td>
                  <td style={{ padding: 'var(--space-md)', fontSize: 13 }}>{att.examTitle}</td>
                  <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>#{att.attemptNumber}</td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: 12,
                        fontWeight: 600,
                        background: `${statusConfig[att.status].color}20`,
                        color: statusConfig[att.status].color,
                      }}
                    >
                      {statusConfig[att.status].label}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-md)', fontWeight: 600 }}>
                    {att.score !== undefined ? `${att.score}/100` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    {att.passed === undefined ? '—' : att.passed ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>ناجح ✓</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>راسب ✗</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)' }}>
                    {att.duration ? `${att.duration} دقيقة` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <button onClick={() => setSelectedAttempt(att)} style={{ padding: '4px 12px', fontSize: 12 }}>
                      تفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-lg)',
            maxWidth: 1200,
          }}
        >
          {/* Attempt Details */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>تفاصيل المحاولة</h3>

            <div style={{ display: 'grid', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>الطالب</span>
                <span style={{ fontWeight: 600 }}>{selectedAttempt.studentName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>الاختبار</span>
                <span>{selectedAttempt.examTitle}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>الحالة</span>
                <span>{statusConfig[selectedAttempt.status].label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>الدرجة</span>
                <span style={{ fontWeight: 600 }}>{selectedAttempt.score !== undefined ? `${selectedAttempt.score}/100` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>النتيجة</span>
                <span>
                  {selectedAttempt.passed === undefined ? '—' : selectedAttempt.passed ? (
                    <span style={{ color: '#10b981' }}>ناجح ✓</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>راسب ✗</span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>مدة الإجابة</span>
                <span>{selectedAttempt.duration ? `${selectedAttempt.duration} دقيقة` : '—'}</span>
              </div>
            </div>

            <h4 style={{ marginBottom: 'var(--space-sm)' }}>الأسئلة والإجابات ({selectedAttempt.correctAnswers}/{selectedAttempt.totalQuestions})</h4>
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              {selectedAttempt.answers.map((ans, idx) => (
                <div key={idx} style={{ padding: 'var(--space-sm)', borderRadius: 'var(--radius-control)', background: ans.correct ? '#10b98110' : '#ef444410', border: `1px solid ${ans.correct ? '#10b98130' : '#ef444430'}` }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>{ans.question}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    إجابة الطالب: <strong>{ans.selected}</strong> {ans.correct ? '✅' : '❌'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Sidebar */}
          <aside>
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-md)' }}>إجراءات</h3>
              <button style={{ width: '100%', marginBottom: 'var(--space-sm)' }}>
                {selectedAttempt.status === 'IN_PROGRESS' ? 'إيقاف المحاولة' : 'إعادة المحاولة'}
              </button>
              {selectedAttempt.status === 'SUBMITTED' && (
                <button style={{ width: '100%', background: 'var(--color-action)', color: 'var(--bg-base)' }}>
                  تقييم يدوي
                </button>
              )}
              <button onClick={() => setSelectedAttempt(null)} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', marginTop: 'var(--space-sm)' }}>
                رجوع
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}