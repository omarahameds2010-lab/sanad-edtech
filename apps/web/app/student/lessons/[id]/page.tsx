'use client';

import Link from 'next/link';

const course = {
  title: 'الرياضيات - جبر وهندسة',
  sections: [
    {
      id: 's1',
      title: 'الوحدة 1: أساسيات الجبر',
      lessons: [
        { id: 'l1', title: 'مقدمة في المتغيرات', type: 'VIDEO', duration: '12:00', status: 'COMPLETED', active: false },
        { id: 'l2', title: 'المعادلات الخطية', type: 'VIDEO', duration: '15:00', status: 'IN_PROGRESS', active: true },
        { id: 'l3', title: 'ورقة عمل: المتغيرات', type: 'PDF', duration: null, status: 'LOCKED', active: false },
        { id: 'l4', title: 'واجب: حل المعادلات', type: 'ASSIGNMENT', duration: '300:00', status: 'LOCKED', active: false },
      ],
    },
    {
      id: 's2',
      title: 'الوحدة 2: الدوال والتركيب',
      lessons: [
        { id: 'l5', title: 'مفهوم الدالة', type: 'VIDEO', duration: '17:00', status: 'LOCKED', active: false },
        { id: 'l6', title: 'الدوال الخطية', type: 'VIDEO', duration: '14:00', status: 'LOCKED', active: false },
        { id: 'l7', title: 'تمارين: الدوال', type: 'ASSIGNMENT', duration: '300:00', status: 'LOCKED', active: false },
      ],
    },
    {
      id: 's3',
      title: 'الوحدة 3: الهندسة التحليلية',
      lessons: [
        { id: 'l8', title: 'الإحداثيات والمستقيمات', type: 'VIDEO', duration: '16:00', status: 'LOCKED', active: false },
        { id: 'l9', title: 'المسافات ومنتصف القطعة', type: 'VIDEO', duration: '13:00', status: 'LOCKED', active: false },
        { id: 'l10', title: 'اختبار: الهندسة التحليلية', type: 'EXAM', duration: '70:00', status: 'LOCKED', active: false },
      ],
    },
  ],
};

const typeBadgeConfig: Record<string, { label: string; color: string }> = {
  VIDEO: { label: 'VID', color: '#3b82f6' },
  PDF: { label: 'PDF', color: '#10b981' },
  ASSIGNMENT: { label: 'واجب', color: '#f59e0b' },
  EXAM: { label: 'اختبار', color: '#ef4444' },
};

const statusColors: Record<string, string> = {
  COMPLETED: '#10b981',
  IN_PROGRESS: '#3b82f6',
  LOCKED: '#6b7280',
};

export default async function StudentLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: activeLessonId } = await params;
  const activeLesson = course.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id === activeLessonId);

  if (!activeLesson) {
    return <div>لم يتم العثور على الدرس</div>;
  }

  const currentSection = course.sections.find((s) => s.lessons.some((l) => l.id === activeLessonId));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 64px)' }}>
      {/* Course outline sidebar */}
      <aside
        style={{
          borderInlineEnd: '1px solid var(--border-subtle)',
          padding: 'var(--space-md)',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ marginBottom: 'var(--space-md)', fontSize: 16 }}>هيكل الكورس</h3>
        {course.sections.map((section) => (
          <div key={section.id} style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, padding: '4px 8px' }}>{section.title}</div>
            {section.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/student/lessons/${lesson.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-control)',
                  background: lesson.id === activeLessonId ? 'var(--bg-surface)' : 'transparent',
                  fontWeight: lesson.id === activeLessonId ? 600 : 400,
                  fontSize: 13,
                  color: lesson.status === 'LOCKED' ? 'var(--text-muted)' : 'var(--text-primary)',
                  pointerEvents: lesson.status === 'LOCKED' ? 'none' : 'auto',
                  opacity: lesson.status === 'LOCKED' ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: statusColors[lesson.status],
                  }}
                />
                <span style={{ flex: 1 }}>{lesson.title}</span>
                {lesson.duration && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lesson.duration}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </aside>

      {/* Lesson content */}
      <main style={{ padding: 'var(--space-lg)' }}>
        <nav style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
          {course.title} › {currentSection?.title} › {activeLesson.title}
        </nav>

        <h1 style={{ marginBottom: 'var(--space-md)' }}>{activeLesson.title}</h1>

        {/* Video lesson */}
        {activeLesson.type === 'VIDEO' && (
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <p style={{ marginTop: 8, fontSize: 14 }}>فيديو: {activeLesson.title}</p>
            </div>
          </div>
        )}

        {/* Assignment lesson */}
        {activeLesson.type === 'ASSIGNMENT' && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>تفاصيل الواجب</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              هذا الواجب متاح لمدة 300 دقيقة. يمكنك محاولة حلّه مرة واحدة.
            </p>
            <button>بدء الواجب</button>
          </div>
        )}

        {/* Exam lesson */}
        {activeLesson.type === 'EXAM' && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>تفاصيل الاختبار</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              هذا الاختبار مدته 70 دقيقة وماكن تديره إلا مرة واحدة. تم خلط الأسئلة تلقائياً.
            </p>
            <button style={{ background: '#ef4444', color: 'white' }}>بدء الاختبار</button>
          </div>
        )}

        {/* PDF resource lesson */}
        {activeLesson.type === 'PDF' && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>ورقة عمل</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              حمّل ورقة العمل واحل الأسئلة قبل الواجب.
            </p>
            <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand)' }}>
              📎 تحميل الورقة (PDF)
            </a>
          </div>
        )}

        {/* Progress bar */}
        <div className="card">
          <h4 style={{ marginBottom: 'var(--space-sm)' }}>تقدّمك في هذا الدرس</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-surface)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '45%', height: '100%', background: 'var(--color-action)', borderRadius: 999 }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>45%</span>
          </div>
        </div>
      </main>
    </div>
  );
}