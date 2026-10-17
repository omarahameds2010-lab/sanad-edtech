import Link from "next/link";
import TeacherCard from "../components/TeacherCard";

export const metadata = {
  title: "المساحات التعليمية — سند",
  description: "كل مدرس مساحة مستقلة داخل نفس المنصة: بهويته، كورساته، وطلابه.",
};

export default function TeachersPage() {
  return (
    <main className="ts-page">
      <p className="lp-eyebrow">مساحات المدرسين</p>
      <h1 className="lp-h2">مساحات تعليمية — لكل مدرس عالمه</h1>
      <p className="lp-lead">
        كل مدرس مساحة مستقلة داخل نفس المنصة: بهويته، وكورساته، وطلابه. تختار
        مدرسك، فتدخل عالمه هو.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          marginTop: 40,
        }}
      >
        <TeacherCard
          slug="saleh-hussein"
          subject="اللغة العربية"
          teacherName="الأستاذ صالح حسين"
          tagline="جوكر اللغة العربية"
          focusAreas="نحو · بلاغة · نصوص"
          courseCount={3}
          motif="ink"
        />

        <Link href="/signup" className="ts-note-dashed">
          <span
            style={{
              alignSelf: "flex-start",
              borderRadius: 999,
              padding: "5px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--color-action-strong)",
              background: "var(--color-action-soft)",
            }}
          >
            للمدرسين
          </span>
          <p
            style={{
              fontWeight: 800,
              fontSize: 18,
              margin: 0,
              color: "var(--ink-700)",
            }}
          >
            مساحتك التعليمية القادمة؟
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13.5,
              lineHeight: 1.85,
              margin: 0,
            }}
          >
            أنشئ مساحتك على سند: كورساتك وطلابك وتقييم يقف جانبك — بهويتك أنت.
          </p>
          <span
            style={{
              color: "var(--color-action-strong)",
              fontWeight: 700,
              fontSize: 14.5,
            }}
          >
            ابدأ من هنا ←
          </span>
        </Link>
      </div>
    </main>
  );
}
