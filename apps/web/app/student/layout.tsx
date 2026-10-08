import Link from 'next/link';
import StudentCommandRegistrar from './StudentCommandRegistrar';

const navItems = [
  { href: '/student', label: 'لوحتي' },
  { href: '/student/courses', label: 'كورساتي' },
  { href: '/student/assignments', label: 'واجباتي' },
  { href: '/student/exams', label: 'اختباراتي' },
  { href: '/student/profile', label: 'الملف الشخصي' },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh' }}>
      <StudentCommandRegistrar />
      <aside style={{ borderInlineEnd: '1px solid var(--border-subtle)', padding: 'var(--space-lg)' }}>
        <Link href="/student" style={{ fontWeight: 700, fontSize: 16, display: 'block', marginBottom: 'var(--space-lg)' }}>
          لوحة الطالب
        </Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-control)', fontSize: 14, color: 'var(--text-primary)' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ padding: 'var(--space-lg)' }}>{children}</main>
    </div>
  );
}