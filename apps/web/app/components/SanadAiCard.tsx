interface SanadAiCardProps {
  score: number;
  maxScore?: number;
  confidence?: string;
  evaluation: string;
  feedback: string;
  knowledgeGap: string;
  nextStep: string;
}

export default function SanadAiCard({
  score,
  maxScore = 100,
  confidence = 'مرتفع',
  evaluation,
  feedback,
  knowledgeGap,
  nextStep,
}: SanadAiCardProps) {
  return (
    <section className="card" aria-label="SANAD AI evaluation">
      <header style={{ marginBottom: 'var(--space-md)' }}>
        <span className="badge">SANAD</span>
        <h2 style={{ marginBottom: 4 }}>تقييم الإجابة العربية</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
          تحليل منظم ومعتمد على البيانات
        </p>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <div>
          <dt style={{ color: 'var(--text-muted)', fontSize: 12 }}>الدرجة</dt>
          <dd style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
            {score}/{maxScore}
          </dd>
        </div>
        <div>
          <dt style={{ color: 'var(--text-muted)', fontSize: 12 }}>الثقة</dt>
          <dd style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{confidence}</dd>
        </div>
      </dl>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)' }}>
        <h3>التقييم</h3>
        <p style={{ color: 'var(--text-muted)' }}>{evaluation}</p>

        <h3>ملاحظات</h3>
        <p style={{ color: 'var(--text-muted)' }}>{feedback}</p>

        <h3>الفجوة المعرفية</h3>
        <p style={{ color: 'var(--text-muted)' }}>{knowledgeGap}</p>

        <h3>الخطوة التالية</h3>
        <p style={{ color: 'var(--color-brand)', fontWeight: 600 }}>{nextStep}</p>
      </div>
    </section>
  );
}
