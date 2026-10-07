'use client';

import { useState } from 'react';

const submissions = [
  {
    id: 'sub1',
    studentName: 'عمر مصطفى',
    assignmentTitle: 'واجب 1: حل المعادلات',
    courseTitle: 'الرياضيات - جبر وهندسة',
    attemptNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-10-05T10:30:00Z',
    timeLimit: 300,
    isLate: false,
    score: null,
    content: 'قامت الطالبة بحل المعادلات باستخدام خطوات صحيحة. المعادلات من الدرجة الأولى والثانية تم حلها باستخدام التحليل والتكعيب.',
    files: [],
  },
  {
    id: 'sub2',
    studentName: 'سارة علي',
    assignmentTitle: 'واجب 1: حل المعادلات',
    courseTitle: 'الرياضيات - جبر وهندسة',
    attemptNumber: 1,
    status: 'GRADED',
    submittedAt: '2026-10-05T09:15:00Z',
    timeLimit: 300,
    isLate: false,
    score: 85,
    content: 'حل صحيح مع شرح واضح للخطوات.',
    files: ['واجب_سارة.pdf'],
  },
  {
    id: 'sub3',
    studentName: 'يوسف أحمد',
    assignmentTitle: 'واجب 1: حل المعادلات',
    courseTitle: 'الرياضيات - جبر وهندسة',
    attemptNumber: 2,
    status: 'SUBMITTED',
    submittedAt: '2026-10-05T23:45:00Z',
    timeLimit: 300,
    isLate: true,
    score: null,
    content: 'تمت المحاولة الثانية بعد المراجعة.',
    files: [],
  },
  {
    id: 'sub4',
    studentName: 'مريم حسن',
    assignmentTitle: 'واجب 1: حل المعادلات',
    courseTitle: 'الرياضيات - جبر وهندسة',
    attemptNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-10-05T08:00:00Z',
    timeLimit: 300,
    isLate: false,
    score: null,
    content: 'حل المعادلات الخطية باستخدام طريقة الرسم البياني.',
    files: ['رسم_بياني.png'],
  },
];

const statusLabels: Record<string, string> = {
  SUBMITTED: 'مُسلم',
  GRADED: 'مُصحّح',
  DRAFT: 'مسودة',
  LATE: 'متأخر',
  REJECTED: 'مرفوض',
};

const statusColors: Record<string, string> = {
  SUBMITTED: '#3b82f6',
  GRADED: '#10b981',
  DRAFT: '#6b7280',
  LATE: '#f59e0b',
  REJECTED: '#ef4444',
};

export default function AssignmentsGradingPage() {
  const [selectedSubmission, setSelectedSubmission] = useState<typeof submissions[0] | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const gradedCount = submissions.filter((s) => s.status === 'GRADED').length;
  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED').length;

  const handleGrade = () => {
    if (!selectedSubmission || !scoreInput) return;
    // In real implementation, call the API
    alert(`تم تسجيل الدرجة: ${scoreInput}% وإرسال ملاحظات للطالب`);
    setScoreInput('');
    setFeedbackInput('');
    setSelectedSubmission(null);
  };

  return (
    <>
      <h1>تصحيح الواجبات</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>بانتظار التصحيح</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{gradedCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>مُصحّح</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{submissions.length}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>الإجمالي</div>
        </div>
      </div>

      {!selectedSubmission ? (
        /* Submissions List */
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'right', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
                <th style={{ padding: 'var(--space-md)' }}>الطالب</th>
                <th style={{ padding: 'var(--space-md)' }}>الواجب</th>
                <th style={{ padding: 'var(--space-md)' }}>المحاولة</th>
                <th style={{ padding: 'var(--space-md)' }}>الحالة</th>
                <th style={{ padding: 'var(--space-md)' }}>تاريخ التسليم</th>
                <th style={{ padding: 'var(--space-md)' }}>المتأخر</th>
                <th style={{ padding: 'var(--space-md)' }}>الدرجة</th>
                <th style={{ padding: 'var(--space-md)' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: 'var(--space-md)', fontWeight: 600 }}>{sub.studentName}</td>
                  <td style={{ padding: 'var(--space-md)', fontSize: 13 }}>{sub.assignmentTitle}</td>
                  <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>#{sub.attemptNumber}</td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: 12,
                        fontWeight: 600,
                        background: `${statusColors[sub.status]}20`,
                        color: statusColors[sub.status],
                      }}
                    >
                      {statusLabels[sub.status]}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(sub.submittedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
                    {sub.isLate ? <span style={{ color: '#f59e0b' }}>نعم</span> : <span style={{ color: 'var(--text-muted)' }}>لا</span>}
                  </td>
                  <td style={{ padding: 'var(--space-md)', fontWeight: 600 }}>
                    {sub.score !== null ? `${sub.score}%` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-md)' }}>
                    <button onClick={() => setSelectedSubmission(sub)} style={{ padding: '4px 12px', fontSize: 12 }}>
                      {sub.status === 'SUBMITTED' ? 'تصحيح' : 'عرض'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grade Panel */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: 'var(--space-lg)',
            maxWidth: 1200,
          }}
        >
          {/* Submission Content */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)' }}>عمل الطالب</h3>
            <div
              style={{
                padding: 'var(--space-md)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-control)',
                minHeight: 200,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
              }}
            >
              {selectedSubmission.content}
            </div>

            {selectedSubmission.files.length > 0 && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <h4>المرفقات</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                  {selectedSubmission.files.map((file, idx) => (
                    <a
                      key={idx}
                      href="#"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 12px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-control)',
                        fontSize: 13,
                        color: 'var(--color-brand)',
                      }}
                    >
                      📎 {file}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grade Panel */}
          <aside>
            <div className="card">
              <h3 style={{ marginBottom: 'var(--space-md)' }}>تصحيح</h3>

              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>الطالب</div>
                <div style={{ fontWeight: 600 }}>{selectedSubmission.studentName}</div>
              </div>

              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>المحاولة</div>
                <div>#{selectedSubmission.attemptNumber} — {selectedSubmission.isLate ? 'متأخر' : 'في الوقت'}</div>
              </div>

              <label style={{ display: 'block', marginBottom: 'var(--space-md)' }}>
                <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  الدرجة (من 100)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  style={inputStyle}
                  placeholder="أدخل الدرجة"
                />
              </label>

              <label style={{ display: 'block', marginBottom: 'var(--space-md)' }}>
                <span style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                  ملاحظات للطالب
                </span>
                <textarea
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="اكتب ملاحظاتك..."
                />
              </label>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button onClick={handleGrade} style={{ flex: 1 }}>
                  حفظ الدرجة
                </button>
                <button
                  onClick={() => { setSelectedSubmission(null); setScoreInput(''); setFeedbackInput(''); }}
                  style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
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