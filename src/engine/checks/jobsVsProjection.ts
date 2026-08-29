import type { Application, Finding } from "@/types";
import { newJobsTotal } from "@/engine/score";
import { makeFinding } from "./helpers";

export function jobsVsProjection(app: Application): Finding[] {
  const jobs = newJobsTotal(app);
  const from = app.growth["2025_proj"].totalEmployees;
  const to = app.growth["2026_proj"].totalEmployees;
  if (jobs == null || from == null || to == null) return [];
  const delta = to - from;
  if (delta === jobs) return [];
  return [
    makeFinding(
      "JOBS_VS_PROJECTION",
      "contradiction",
      "New jobs do not match the 2025→2026 headcount change",
      `The positions table sums to ${jobs} new jobs, but total employees move from ${from} (2025 proj) to ${to} (2026 proj), a delta of ${delta}.`,
      [
        "jobPositions",
        "growth.2025_proj.totalEmployees",
        "growth.2026_proj.totalEmployees",
      ],
      { tableJobs: jobs, employees2025: from, employees2026: to, delta },
    ),
  ];
}
