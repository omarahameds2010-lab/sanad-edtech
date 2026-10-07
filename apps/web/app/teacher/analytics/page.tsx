'use client';

const enrollmentData = [
  { month: 'مايو', value: 42 },
  { month: 'يونيو', value: 68 },
  { month: 'يوليو', value: 95 },
  { month: 'أغسطس', value: 120 },
  { month: 'سبتمبر', value: 158 },
  { month: 'أكتوبر', value: 210 },
];

const revenueData = [
  { month: 'مايو', value: 8400 },
  { month: 'يونيو', value: 13600 },
  { month: 'يوليو', value: 19000 },
  { month: 'أغسطس', value: 24000 },
  { month: 'سبتمبر', value: 31600 },
  { month: 'أكتوبر', value: 42000 },
];

const progressData = [
  { range: '0-25%', count: 15 },
  { range: '25-50%', count: 28 },
  { range: '50-75%', count: 42 },
  { range: '75-100%', count: 24 },
  { range: '100%', count: 18 },
];

const completionData = [
  { course: 'الرياضيات', rate: 68 },
  { course: 'الفيزياء', rate: 72 },
  { course: 'العربية', rate: 81 },
  { course: 'الإنجليزية', rate: 55 },
];

const recentEvents = [
  { text: '5 طلاب جدد سجلوا هذا الأسبوع', type: 'success' },
  { text: 'نسبة الإكمال انخفضت 12% في الوحدة 3', type: 'warning' },
  { text: '8 فيديوهات تم معالجتها بنجاح', type: 'info' },
  { text: '23 واجب بانتظار التصحيح', type: 'warning' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const maxVal = Math.max(...enrollmentData.map((d) => d.value));
  const maxRev = Math.max(...revenueData.map((d) => d.value));
  const totalStudents = enrollmentData[enrollmentData.length - 1].value;
  const prevMonth = enrollmentData[enrollmentData.length - 2].value;
  const growth = Math.round(((totalStudents - prevMonth) / prevMonth) * 100);

  return (
    <>
      <h1>التحليلات</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
        نظرة شاملة على أداء الكورسات والطلاب والإيرادات.
      </p>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        {[
          { label: 'إجمالي الطلاب', value: totalStudents, change: `+${growth}%`, color: '#3b82f6' },
          { label: 'نسبة الإكمال', value: '68%', change: '+3%', color: '#10b981' },
          { label: 'الإيرادات', value: '42,000 ج.م', change: '+12%', color: '#f59e0b' },
          { label: 'الكورسات النشطة', value: '4', change: '+1', color: '#8b5cf6' },
        ].map((metric) => (
          <div key={metric.label} className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{metric.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{metric.value}</div>
            <div style={{ fontSize: 12, color: metric.color, marginTop: 4 }}>{metric.change} من الشهر الماضي</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Enrollment Trend */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-md)' }}>نمو التسجيل</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-sm)', height: 200, paddingBottom: 'var(--space-md)' }}>
            {enrollmentData.map((d) => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.value}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(d.value / maxVal) * 160}px`,
                    background: '#3b82f6',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4,
                    transition: 'height 300ms',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-md)' }}>الإيرادات</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-sm)', height: 200, paddingBottom: 'var(--space-md)' }}>
            {revenueData.map((d) => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{(d.value / 1000).toFixed(0)}k</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(d.value / maxRev) * 160}px`,
                    background: '#10b981',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4,
                    transition: 'height 300ms',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-md)' }}>توزيع التقدم</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-sm)', height: 200, paddingBottom: 'var(--space-md)' }}>
            {progressData.map((d, i) => (
              <div key={d.range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.count}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${(d.count / Math.max(...progressData.map((p) => p.count))) * 160}px`,
                    background: COLORS[i],
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4,
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course Completion */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-md)' }}>إكمال الكورسات</h3>
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {completionData.map((c) => (
              <div key={c.course} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span style={{ width: 80, fontSize: 13, color: 'var(--text-muted)' }}>{c.course}</span>
                <div style={{ flex: 1, height: 12, background: 'var(--bg-surface)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${c.rate}%`,
                      height: '100%',
                      background: c.rate >= 70 ? '#10b981' : c.rate >= 50 ? '#f59e0b' : '#ef4444',
                      borderRadius: 999,
                    }}
                  />
                </div>
                <span style={{ width: 36, fontSize: 12, color: 'var(--text-muted)', textAlign: 'left' }}>{c.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)' }}>أهم الأحداث</h3>
        <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
          {recentEvents.map((event, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-control)',
                background: event.type === 'success' ? '#10b98110' : event.type === 'warning' ? '#f59e0b10' : '#3b82f610',
              }}
            >
              <span style={{ color: event.type === 'success' ? '#10b981' : event.type === 'warning' ? '#f59e0b' : '#3b82f6' }}>
                {event.type === 'success' ? '✓' : event.type === 'warning' ? '⚠' : 'ℹ'}
              </span>
              <span>{event.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}