import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

if (!key) {
  console.error("FAIL: GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

console.log(`Key present (length ${key.length}), model ${model}`);

const ai = new GoogleGenAI({ apiKey: key });
const response = await ai.models.generateContent({
  model,
  contents: 'Reply with the single word PONG and nothing else.',
});

const text = (response.text ?? "").trim();
console.log(`Model replied: ${JSON.stringify(text)}`);
if (!/pong/i.test(text)) {
  console.error("FAIL: unexpected reply");
  process.exit(1);
}
console.log("PASS: Gemini API key works");
