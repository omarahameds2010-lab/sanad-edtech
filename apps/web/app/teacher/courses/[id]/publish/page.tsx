import { redirect } from "next/navigation";

/**
 * Legacy mock publish screen.
 *
 * The real publish action lives on the course workspace, using the API's
 * readiness checks. This route previously rendered hard-coded readiness data,
 * so it now redirects to the course workspace instead of inventing status.
 */
export default async function CoursePublishRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/teacher/courses/${encodeURIComponent(id)}`);
}
