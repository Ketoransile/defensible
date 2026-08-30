import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assessBatch, explainBatch } from "@/engine";
import { getApplications } from "@/lib/applicationsRepo";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { summarizeReviewerIntegrity } from "@/lib/reviewerIntegrity";
import { ReviewerApp } from "@/components/reviewer/ReviewerApp";

export default async function ReviewPage() {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login?next=/review");

  const apps = await getApplications();
  const batch = await explainBatch(assessBatch(apps));
  const applications = Object.fromEntries(apps.map((app) => [app.id, app]));
  const integrity = summarizeReviewerIntegrity(batch, applications);

  return (
    <ReviewerApp
      batch={batch}
      applications={applications}
      integrity={integrity}
      reviewerName={session.name}
    />
  );
}
