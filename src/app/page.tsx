import { assessBatch, explainBatch } from "@/engine";
import { loadApplications } from "@/lib/loadFixtures";
import { ReviewerApp } from "@/components/reviewer/ReviewerApp";
import type { Application } from "@/types";

export default async function Home() {
  const batch = await explainBatch(assessBatch());
  const applications = Object.fromEntries(
    loadApplications().map((app: Application) => [app.id, app]),
  );

  return <ReviewerApp batch={batch} applications={applications} />;
}
