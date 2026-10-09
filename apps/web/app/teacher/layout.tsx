import Link from 'next/link';
import TeacherCommandRegistrar from './TeacherCommandRegistrar';

const navItems = [
  { href: '/teacher', label: 'نظرة عامة' },
  { href: '/teacher/courses', label: 'الكورسات' },
  { href: '/teacher/students', label: 'الطلاب' },
  { href: '/teacher/assignments', label: 'الواجبات' },
  { href: '/teacher/exams', label: 'الاختبارات' },
  { href: '/teacher/payments', label: 'المدفوعات' },
  { href: '/teacher/analytics', label: 'التحليلات' },
  { href: '/teacher/settings', label: 'الإعدادات' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <TeacherCommandRegistrar />
      <aside style={{ borderRight: '1px solid #e5e5e5', padding: 24 }}>
        <Link href="/teacher" style={{ fontWeight: 700, fontSize: 18, color: '#0b0d10' }}>
          لوحة المعلم
        </Link>
        <nav style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '8px 12px',
                borderRadius: 16,
                color: '#525252',
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 24 }}>
          <Link href="/teacher/courses/new" style={{
            display: 'block',
            width: '100%',
            background: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: 16,
            padding: '10px 24px',
            fontWeight: 600,
            textAlign: 'center',
            marginTop: 8,
          }}>
            + كورس جديد
          </Link>
        </div>
      </aside>
      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
}