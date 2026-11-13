import { redirect } from "next/navigation";

/**
 * Legacy mock builder.
 *
 * The real authoring workspace is `/teacher/courses/[id]`: it loads the course
 * from the API and supports sections, lessons, publishing, and deletion. This
 * route previously rendered a hard-coded course, so it now redirects to the
 * real workspace instead of showing fabricated data.
 */
export default async function CourseBuilderRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/teacher/courses/${encodeURIComponent(id)}`);
}
