import type { MetadataRoute } from "next";
import { api } from "@/app/lib/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sanad-edtech.vercel.app";

// Rebuild hourly so a newly published course enters the sitemap without a
// redeploy. The course fetch is best-effort: a cold or unreachable API must
// never break the sitemap, so the static core is always emitted.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/courses`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/teachers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/teachers/saleh-hussein`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  try {
    const courses = await api.listPublicCourses();
    const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${SITE_URL}/courses/${course.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...core, ...coursePages];
  } catch {
    return core;
  }
}
