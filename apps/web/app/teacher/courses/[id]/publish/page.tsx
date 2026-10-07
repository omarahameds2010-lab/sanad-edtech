'use client';

import { useState } from 'react';
import Link from 'next/link';

const readinessChecks = [
  { id: 'title', label: 'عنوان الكورس', ok: true },
  { id: 'description', label: 'وصف الكورس', ok: true },
  { id: 'thumbnail', label: 'صورة مصغرة', ok: true },
  { id: 'sections', label: 'أقسام على الأقل', ok: true },
  { id: 'lessons', label: 'دروس على الأقل', ok: true },
  { id: 'video1', label: 'فيديو Lesson 1 — قيد المعالجة', ok: false },
  { id: 'lesson5', label: 'Lesson 5 — لا يوجد محتوى', ok: false },
  { id: 'exam1', label: 'Exam 1 — لا يحتوي على أسئلة', ok: false },
];

const publishtags = [
  { id: '12 lessons', label: '12 درس' },
  { id: '4 resources', label: '4 موارد' },
  { id: '2 assignments', label: '2 واجب' },
  { id: '1 exam', label: '1 اختبار' },
];

export default function PublishCoursePage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [published, setPublished] = useState(false);

  const allReady = readinessChecks.every((c) => c.ok);
  const blockingIssues = readinessChecks.filter((c) => !c.ok);

  if (published) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <div style={{ fontSize: 48, marginBottom: 'var(--space-md)' }}>🎉</div>
        <h2>تم النشر بنجاح!</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          كورس "الرياضيات - جبر وهندسة" الآن متاح للطلاب.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', marginTop: 'var(--space-lg)' }}>
          <Link href="/teacher/courses/c2">
            <button>العودة للكورس</button>
          </Link>
          <Link href="/courses">
            <button style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              عرض الكورس
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1>نشر الكورس</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', maxWidth: 800 }}>
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-md)' }}>جاهزية النشر</h2>
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {readinessChecks.map((check) => (
              <div
                key={check.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-control)',
                  background: check.ok ? '#10b98110' : '#ef444410',
                }}
              >
                <span style={{ fontSize: 16 }}>{check.ok ? '✅' : '❌'}</span>
                <span
                  style={{
                    textDecoration: check.ok ? 'none' : 'line-through',
                    color: check.ok ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {check.label}
                </span>
              </div>
            ))}
          </div>

          {!allReady && (
            <div
              style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: '#ef444410',
                borderRadius: 'var(--radius-control)',
                border: '1px solid #ef444430',
              }}
            >
              <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: 'var(--space-xs)' }}>
                لا يمكن النشر بعد
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                يوجد {blockingIssues.length} عناصر تحتاج إلى إصلاح قبل النشر.
              </div>
              <button
                style={{
                  marginTop: 'var(--space-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
                onClick={() => {
                  const issues = blockingIssues.map((i) => i.label).join('\n');
                  alert(`عناصر تحتاج إصلاح:\n\n${issues}`);
                }}
              >
                عرض المشكلات
              </button>
            </div>
          )}

          {allReady && (
            <button
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
              onClick={() => setShowConfirm(true)}
            >
              نشر الكورس
            </button>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-md)' }}>ملخص الكورس</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--space-sm)' }}>
            {publishtags.map((tag) => (
              <li key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-action)' }} />
                <span>{tag.label}</span>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-control)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              <strong>ملاحظة:</strong> الكورس سيكون متاحًا للطلاب فور النشر. يمكنك إلغاء النشر لاحقًا.
            </p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 'var(--space-md)' }}>تأكيد النشر</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              هل أنت متأكد من نشر الكورس "الرياضيات - جبر وهندسة"؟ سيظهر للطلاب فور النشر.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <button onClick={() => { setShowConfirm(false); setPublished(true); }} style={{ flex: 1 }}>
                نشر الآن
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}