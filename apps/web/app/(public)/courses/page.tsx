import Link from 'next/link';

export default function CoursesPage() {
  return (
    <main>
      <h1>الكورسات</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        استكشف المساحات التعليمية المتاحة.
      </p>
      <div className="card">
        <h2>قريبًا</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          قائمة الكورسات العامة ستبدأ تظهر هنا بعد ربط الـ API.
        </p>
      </div>
    </main>
  );
}
