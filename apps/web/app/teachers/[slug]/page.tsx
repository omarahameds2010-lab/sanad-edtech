import { notFound } from "next/navigation";
import TeacherSpaceContent from "./TeacherSpaceContent";

/** The one real space of the demo: الأستاذ صالح حسين — جوكر اللغة العربية. */
const SPACE = {
  slug: "saleh-hussein",
  name: "الأستاذ صالح حسين",
  tagline: "جوكر اللغة العربية",
  bio: "نحو وبلاغة ونصوص للمرحلة الإعدادية — شرح يوصّل القاعدة من غير حفظ أعمى، وتدريب مستمر يراجع معاك نقاط التحسين قبل الامتحان.",
};

export function generateStaticParams() {
  return [{ slug: SPACE.slug }];
}

export async function generateMetadata() {
  return {
    title: `${SPACE.name} — ${SPACE.tagline}`,
    description: SPACE.bio,
  };
}

export default async function TeacherSpacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== SPACE.slug) notFound();

  return <TeacherSpaceContent />;
}
