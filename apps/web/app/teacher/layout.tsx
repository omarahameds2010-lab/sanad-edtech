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
      <aside style={{ borderInlineEnd: '1px solid var(--border-subtle)', padding: 'var(--space-lg)' }}>
        <Link href="/teacher" style={{ fontWeight: 700, fontSize: 18 }}>لوحة المعلم</Link>
        <nav style={{ marginTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text-primary)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <Link href="/teacher/courses/new">
            <button style={{ width: '100%' }}>+ كورس جديد</button>
          </Link>
        </div>
      </aside>
      <main style={{ padding: 'var(--space-xl)' }}>{children}</main>
    </div>
  );
}
