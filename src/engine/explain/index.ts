import type { Assessment, BatchResult } from "@/types";
import { geminiBrief } from "./gemini";
import { attachTemplateBriefs } from "./template";

export { attachTemplateBriefs } from "./template";
export { geminiApiKey } from "./gemini";

function neighborLine(list: Assessment[], i: number): string | null {
  if (i === 0) return null;
  const above = list[i - 1];
  return `${above.companyName ?? above.applicationId} (rank ${above.rank}, ${above.totalPoints} pts)`;
}

/**
 * Rank-aware reviewer copy. Templates always; Gemini polishes when
 * GEMINI_API_KEY is set or a disk cache hit exists.
 */
export async function explainBatch(batch: BatchResult): Promise<BatchResult> {
  const withTemplates = {
    ...batch,
    assessments: attachTemplateBriefs(batch.assessments),
  };

  const assessments: Assessment[] = [];
  let skipLive = false;
  for (let i = 0; i < withTemplates.assessments.length; i++) {
    const a = withTemplates.assessments[i];
    const { brief, exhausted } = await geminiBrief(
      a,
      neighborLine(withTemplates.assessments, i),
      { skipLive },
    );
    if (exhausted) skipLive = true;
    assessments.push(
      brief
        ? { ...a, brief, justification: brief.justification }
        : a,
    );
  }

  return { ...withTemplates, assessments };
}
