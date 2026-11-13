import { redirect } from "next/navigation";

/**
 * Legacy mock preview.
 *
 * The real course workspace is the source of truth; the public course page is
 * `/courses/[slug]`. This route used to render a hard-coded course and is now
 * redirected to the real teacher workspace.
 */
export default async function CoursePreviewRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/teacher/courses/${encodeURIComponent(id)}`);
}
