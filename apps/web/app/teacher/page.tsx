const kpis = [
  { label: 'طلاب نشطون', value: '1,240', href: '/teacher/students' },
  { label: 'كورسات منشورة', value: '12', href: '/teacher/courses' },
  { label: 'نسبة الإكمال', value: '68%', href: '/teacher/analytics' },
  { label: 'الإيرادات', value: '18,400 ج.م', href: '/teacher/payments' },
  { label: 'واجبات بانتظار التصحيح', value: '5', href: '/teacher/assignments' },
];

const actions = [
  { title: '5 واجبات بانتظار التصحيح', cta: 'صحّح الآن', href: '/teacher/assignments' },
  { title: 'فيديو ما زال قيد المعالجة', cta: 'إعادة المحاولة', href: '/teacher/courses' },
  { title: 'كورس بدون صورة مصغرة', cta: 'أكمل الإعداد', href: '/teacher/courses' },
  { title: 'مسودة كورس غير مكتملة', cta: 'أكمل التحرير', href: '/teacher/courses' },
];

export default function TeacherDashboard() {
  return (
    <>
      <header style={{ marginBottom: 'var(--space-lg)' }}>
        <h1>صباح الخير، أحمد</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          أدر مساحتك التعليمية والكورسات الخاصة بك.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <a href="/teacher/courses/new"><button>أنشئ كورس</button></a>
          <a href="/teacher/courses" style={{ alignSelf: 'center' }}>تابع التحرير</a>
          <a href="/teacher/students" style={{ alignSelf: 'center' }}>عرض الطلاب</a>
        </div>
      </header>

      <section aria-label="مؤشرات الأداء">
        <h2>مؤشرات الأداء</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {kpis.map((kpi) => (
            <a key={kpi.label} href={kpi.href} className="card" style={{ display: 'block', color: 'inherit' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{kpi.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{kpi.value}</div>
            </a>
          ))}
        </div>
      </section>

      <section aria-label="مركز الإجراءات" style={{ marginTop: 'var(--space-lg)' }}>
        <h2>مركز الإجراءات</h2>
        <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          {actions.map((action) => (
            <div
              key={action.title}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{action.title}</span>
              <a href={action.href} style={{ fontWeight: 600 }}>{action.cta} ←</a>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
