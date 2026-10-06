import Link from 'next/link';

interface TeacherCardProps {
  slug: string;
  subject: string;
  teacherName: string;
  focusAreas: string;
  courseCount: number;
  studentCount: number;
  motif: 'orbit' | 'grid' | 'ink';
}

const motifStyles: Record<TeacherCardProps['motif'], string> = {
  orbit: 'radial-gradient(circle at 30% 30%, var(--tenant-accent) 0, transparent 60%)',
  grid: 'linear-gradient(var(--tenant-accent) 1px, transparent 1px), linear-gradient(90deg, var(--tenant-accent) 1px, transparent 1px)',
  ink: 'repeating-linear-gradient(45deg, var(--tenant-accent) 0 2px, transparent 2px 12px)',
};

export default function TeacherCard({
  slug,
  subject,
  teacherName,
  focusAreas,
  courseCount,
  studentCount,
  motif,
}: TeacherCardProps) {
  return (
    <article
      className="card"
      style={{ position: 'relative', overflow: 'hidden', minHeight: 260 }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: motifStyles[motif],
          backgroundSize: motif === 'grid' ? '24px 24px' : undefined,
          opacity: 'var(--tenant-motif-opacity)',
        }}
      />
      <div style={{ position: 'relative' }}>
        <span className="badge">{subject}</span>
        <h2 style={{ marginBottom: 4 }}>{teacherName}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>{focusAreas}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {courseCount} كورس · {studentCount.toLocaleString('ar-EG')} طالب
        </p>
        <Link
          href={`/teachers/${slug}`}
          style={{
            display: 'inline-block',
            marginTop: 'var(--space-sm)',
            fontWeight: 600,
          }}
        >
          دخول المساحة ←
        </Link>
      </div>
    </article>
  );
}
