import { cookies } from "next/headers";
import {
  assessBatch,
  evaluateEligibility,
  runChecks,
  scoreApplication,
} from "@/engine";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getApplications } from "@/lib/applicationsRepo";
import { validateCitations } from "@/lib/fields";
import { summarizeReviewerIntegrity } from "@/lib/reviewerIntegrity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function pace(signal: AbortSignal, ms = 900): Promise<void> {
  if (signal.aborted) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });

    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
  });
}

export async function GET(request: Request): Promise<Response> {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (payload: unknown) => {
        if (closed || request.signal.aborted) return;
        controller.enqueue(sse(payload));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      try {
        const applications = await getApplications();
        send({
          type: "step",
          step: {
            id: "batch",
            title: "Application batch opened",
            detail: `${applications.length} files loaded for review`,
            metric: `${applications.length} files`,
          },
        });
        await pace(request.signal);
        if (request.signal.aborted) return close();

        const eligibility = applications.map(evaluateEligibility);
        const eligibilityChecks = eligibility.reduce(
          (sum, result) => sum + result.checks.length,
          0,
        );
        const excluded = eligibility.filter(
          (result) => result.verdict === "excluded",
        ).length;
        send({
          type: "step",
          step: {
            id: "eligibility",
            title: "Eligibility gates complete",
            detail: `${eligibilityChecks} checks run · ${excluded} file excluded`,
            metric: `${eligibilityChecks} checks`,
          },
        });
        await pace(request.signal);
        if (request.signal.aborted) return close();

        const findingSets = applications.map(runChecks);
        const findingCount = findingSets.reduce(
          (sum, findings) => sum + findings.length,
          0,
        );
        send({
          type: "step",
          step: {
            id: "findings",
            title: "Contradiction scan complete",
            detail: `${findingCount} evidence conflicts surfaced`,
            metric: `${findingCount} findings`,
          },
        });
        await pace(request.signal);
        if (request.signal.aborted) return close();

        const scored = applications.map((application) => ({
          application,
          criteria: scoreApplication(application),
        }));
        const criteriaCount = scored.reduce(
          (sum, result) => sum + result.criteria.length,
          0,
        );
        send({
          type: "step",
          step: {
            id: "scoring",
            title: "Official grid applied",
            detail: `${criteriaCount} criteria evaluated on published bands`,
            metric: `${criteriaCount} criteria`,
          },
        });
        await pace(request.signal);
        if (request.signal.aborted) return close();

        let citations = 0;
        let validCitations = 0;
        for (const result of scored) {
          for (const criterion of result.criteria) {
            citations += criterion.citations.length;
            validCitations += validateCitations(
              result.application,
              criterion.citations,
            ).valid.length;
          }
        }
        send({
          type: "step",
          step: {
            id: "citations",
            title: "Citation paths validated",
            detail: `${validCitations} of ${citations} evidence links resolve`,
            metric: `${validCitations}/${citations} valid`,
            tone: validCitations === citations ? "success" : "danger",
          },
        });
        await pace(request.signal);
        if (request.signal.aborted) return close();

        const batch = assessBatch(applications);
        const applicationMap = Object.fromEntries(
          applications.map((application) => [application.id, application]),
        );
        const summary = summarizeReviewerIntegrity(batch, applicationMap);
        const leader = batch.assessments[0];
        send({
          type: "step",
          step: {
            id: "ranking",
            title: "Shortlist ranked",
            detail: leader
              ? `Rank 1 · ${leader.companyName ?? leader.applicationId} · ${leader.totalPoints}/${leader.maxAvailablePoints}`
              : "No applications available to rank",
            metric: leader ? `${leader.totalPoints} points` : "No rank",
          },
        });
        await pace(request.signal, 650);
        if (request.signal.aborted) return close();

        send({ type: "done", summary });
      } catch {
        send({
          type: "error",
          text: "The reviewer agent could not complete this run.",
        });
      } finally {
        close();
      }
    },
    cancel() {
      // Request.signal is aborted by the runtime when the client disconnects.
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
