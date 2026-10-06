import SanadAiCard from '../../components/SanadAiCard';

const teacherSpace = {
  slug: 'mona-arabic',
  name: 'أستاذة منى',
  subject: 'لغة عربية',
  bio: 'مدرسة اللغة العربية والبلاغة — تبسيط النحو والبلاغة لطلاب الثانوية العامة.',
  accent: '#c0772a',
};

export function generateStaticParams() {
  return [{ slug: 'mona-arabic' }, { slug: 'ahmed-physics' }, { slug: 'khaled-math' }];
}

export default async function TeacherSpacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const isArabic = slug === 'mona-arabic';

  return (
    <main
      data-subject={isArabic ? 'arabic' : undefined}
      style={{ '--tenant-accent': isArabic ? teacherSpace.accent : undefined } as React.CSSProperties}
    >
      <header style={{ marginBottom: 'var(--space-lg)' }}>
        <span className="badge">{isArabic ? 'لغة عربية' : 'مساحة معلم'}</span>
        <h1 style={{ fontSize: 40, marginBottom: 4 }}>
          {isArabic ? teacherSpace.name : 'مساحة المعلم'}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 640 }}>
          {isArabic ? teacherSpace.bio : 'مساحة تعليمية ضمن المنصة.'}
        </p>
      </header>

      <section style={{ marginBottom: 'var(--space-lg)' }}>
        <h2>الكورسات</h2>
        <div className="card">
          <p style={{ color: 'var(--text-muted)' }}>
            سيظهر هنا كتالوج الكورسات الخاص بهذه المساحة.
          </p>
        </div>
      </section>

      {isArabic && (
        <section>
          <h2>تقييم SANAD</h2>
          <SanadAiCard
            score={82}
            confidence="مرتفع"
            evaluation="أتقنت الطالبة القواعد النحوية في تحليل الجملة، لكن هناك خلط بسيط في تمييز المفعول المطلق."
            feedback="راجع درس المفعول المطلق وأعد حل التمارين 5–8."
            knowledgeGap="التفريق بين المفعول المطلق والمفعول به في الجمل المركبة."
            nextStep="ابدأ الدرس التالي: المفعول المطلق — تمارين إضافية."
          />
        </section>
      )}
    </main>
  );
}
