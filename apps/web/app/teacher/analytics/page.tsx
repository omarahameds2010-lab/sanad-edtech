import { redirect } from "next/navigation";

/**
 * Temporary redirect while the real analytics endpoint is being built.
 *
 * The previous page rendered intentionally empty placeholders and appeared in
 * the teacher navigation. Keeping a visible "no data" screen is worse than
 * sending the teacher back to the dashboard, which already shows real data.
 */
export default function AnalyticsRedirectPage() {
  redirect("/teacher");
}
