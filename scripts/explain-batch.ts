import { assessBatch } from "../src/engine/assess";
import { explainBatch, geminiApiKey } from "../src/engine/explain";

const batch = await explainBatch(assessBatch());
const gemini = batch.assessments.filter((a) => a.brief.source === "gemini").length;

console.log(
  geminiApiKey()
    ? `Gemini wrote ${gemini}/${batch.assessments.length} briefs (rest cache/template).`
    : "No GEMINI_API_KEY. Template briefs only. Put the key in .env.local and re-run: npm run explain",
);

for (const a of batch.assessments) {
  console.log(`\n#${a.rank} ${a.brief.source}  ${a.companyName}`);
  console.log(`  ${a.brief.headline}`);
}
