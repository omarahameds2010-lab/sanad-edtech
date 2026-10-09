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
      <aside style={{ borderRight: '1px solid #e5e5e5', padding: 24 }}>
        <Link href="/student" style={{ fontWeight: 700, fontSize: 16, color: '#0b0d10' }}>
          لوحة الطالب
        </Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 10px',
                borderRadius: 16,
                color: '#525252',
                fontSize: 13,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}