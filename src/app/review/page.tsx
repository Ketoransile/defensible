import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { assessBatch, explainBatch } from "@/engine";
import { loadApplications } from "@/lib/loadFixtures";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { ReviewerApp } from "@/components/reviewer/ReviewerApp";
import type { Application } from "@/types";

export default async function ReviewPage() {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login?next=/review");

  const batch = await explainBatch(assessBatch());
  const applications = Object.fromEntries(
    loadApplications().map((app: Application) => [app.id, app]),
  );

  return (
    <ReviewerApp
      batch={batch}
      applications={applications}
      reviewerName={session.name}
    />
  );
}
