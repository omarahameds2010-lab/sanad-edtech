import TeacherCard from '../components/TeacherCard';

const teachers = [
  {
    slug: 'ahmed-physics',
    subject: 'فيزياء',
    teacherName: 'دكتور أحمد',
    focusAreas: 'ميكانيكا · موجات · كهرباء',
    courseCount: 24,
    studentCount: 1240,
    motif: 'orbit' as const,
  },
  {
    slug: 'mona-arabic',
    subject: 'لغة عربية',
    teacherName: 'أستاذة منى',
    focusAreas: 'بلاغة · نحو · أدب',
    courseCount: 18,
    studentCount: 980,
    motif: 'ink' as const,
  },
  {
    slug: 'khaled-math',
    subject: 'رياضيات',
    teacherName: 'مهندس خالد',
    focusAreas: 'جبر · هندسة · تفاضل',
    courseCount: 31,
    studentCount: 1870,
    motif: 'grid' as const,
  },
];

export default function TeachersPage() {
  return (
    <main>
      <h1>المساحات التعليمية</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        كل مدرس هو مساحة داخل نفس المنصة.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-lg)',
        }}
      >
        {teachers.map((t) => (
          <TeacherCard key={t.slug} {...t} />
        ))}
      </div>
    </main>
  );
}
