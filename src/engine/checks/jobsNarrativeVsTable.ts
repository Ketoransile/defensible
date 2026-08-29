import type { Application, Finding } from "@/types";
import { newJobsTotal } from "@/engine/score";
import { makeFinding } from "./helpers";

const JOBS_PHRASE = /(\d+)\s+new jobs/i;

export function extractNarrativeJobCount(narrative: string | null): number | null {
  if (!narrative) return null;
  const match = narrative.match(JOBS_PHRASE);
  if (!match) return null;
  return Number(match[1]);
}

export function jobsNarrativeVsTable(app: Application): Finding[] {
  const stated = extractNarrativeJobCount(app.jobCreationNarrative);
  const table = newJobsTotal(app);
  if (stated == null || table == null) return [];
  if (stated === table) return [];
  return [
    makeFinding(
      "JOBS_NARRATIVE_VS_TABLE",
      "contradiction",
      "Job-creation narrative does not match the positions table",
      `Narrative states ${stated} new jobs; the table sums to ${table}.`,
      ["jobCreationNarrative", "jobPositions"],
      { narrativeJobs: stated, tableJobs: table },
    ),
  ];
}
