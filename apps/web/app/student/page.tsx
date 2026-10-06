export default function StudentDashboard() {
  return (
    <main>
      <h1>لوحة الطالب</h1>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2>أكمل التعلم</h2>
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>
            لا توجد دروس قيد التقدم بعد.
          </p>
        </div>
      </section>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2>كورساتي</h2>
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>لم تسجّل في أي كورس بعد.</p>
        </div>
      </section>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2>التقدم</h2>
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>لا يوجد تقدم بعد.</p>
        </div>
      </section>

      <section>
        <h2>الواجبات والاختبارات القادمة</h2>
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>
            لا توجد واجبات أو اختبارات متاحة الآن.
          </p>
        </div>
      </section>
    </main>
  );
}
