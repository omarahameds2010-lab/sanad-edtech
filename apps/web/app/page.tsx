import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>ONE LEARNING UNIVERSE</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Many learning identities. One coherent system.
      </p>
      <p>
        <Link href="/courses">تصفح الكورسات</Link>
        {' · '}
        <Link href="/student">لوحة الطالب</Link>
        {' · '}
        <Link href="/login">دخول</Link>
      </p>
    </main>
  );
}
