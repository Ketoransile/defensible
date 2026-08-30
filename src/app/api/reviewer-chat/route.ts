import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { assessBatch, geminiApiKey } from "@/engine";
import { getApplication, getApplications } from "@/lib/applicationsRepo";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import {
  buildReviewerChatContext,
  chatSystemPrompt,
  isCutOffReply,
  localAssistantReply,
  wrapReviewerTurn,
  type ReviewerChatContext,
} from "@/lib/reviewerChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

/**
 * Gemini 3 thinks at HIGH by default. Thinking tokens count against
 * maxOutputTokens — a 512 cap cuts the spoken reply mid-sentence.
 */
function thinkingConfig() {
  if (MODEL.includes("gemini-3")) {
    return { thinkingLevel: "LOW" as const };
  }
  return { thinkingBudget: 0 };
}

function visibleGeminiText(response: {
  text?: string;
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
}): { text: string; cutOff: boolean } {
  const candidate = response.candidates?.[0];
  const fromParts = (candidate?.content?.parts ?? [])
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("");
  const text = (fromParts || response.text || "").trim();
  const reason = String(candidate?.finishReason ?? "");
  const cutOff =
    reason === "MAX_TOKENS" || (text.length > 0 && isCutOffReply(text));
  return { text, cutOff };
}

/** Gemini full reply, then SSE token chunks (avoids Next mid-stream abort). */
async function geminiAnswer(
  key: string,
  history: { role: string; parts: { text: string }[] }[],
  ctx: ReviewerChatContext,
  signal: AbortSignal,
): Promise<{ text: string; cutOff: boolean }> {
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: history,
    config: {
      temperature: 0.2,
      systemInstruction: chatSystemPrompt(ctx),
      maxOutputTokens: 8192,
      thinkingConfig: thinkingConfig(),
      abortSignal: signal,
    },
  });
  return visibleGeminiText(response);
}

function chunkForSse(text: string): string[] {
  // Prefer word-ish chunks so the UI still feels live without true token stream.
  const parts = text.match(/\S+\s*/g);
  return parts && parts.length > 0 ? parts : [text];
}

function sseResponse(
  run: (
    send: (payload: unknown) => void,
    signal: AbortSignal,
  ) => Promise<void>,
  requestSignal: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  const abort = new AbortController();

  const onParentAbort = () => abort.abort();
  if (requestSignal.aborted) abort.abort();
  else requestSignal.addEventListener("abort", onParentAbort, { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;

      const send = (payload: unknown) => {
        if (closed || abort.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(sse(payload)));
        } catch {
          closed = true;
          abort.abort();
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        requestSignal.removeEventListener("abort", onParentAbort);
        try {
          controller.close();
        } catch {
          /* already closed by the runtime */
        }
      };

      try {
        await run(send, abort.signal);
      } catch (err) {
        if (!abort.signal.aborted) {
          const message = err instanceof Error ? err.message : "Chat failed";
          console.error(`[reviewer-chat] ${message}`);
          send({
            type: "error",
            text: "Assistant failed. Try again in a moment.",
          });
        }
      } finally {
        close();
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

export async function POST(request: Request) {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { applicationId?: string; messages?: ChatMessage[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const applicationId = String(body.applicationId ?? "").trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  if (!applicationId || !lastUser?.content?.trim()) {
    return Response.json(
      { error: "applicationId and a user message are required" },
      { status: 400 },
    );
  }

  if (messages.length > 24) {
    return Response.json(
      { error: "Conversation too long. Clear chat and try again." },
      { status: 400 },
    );
  }

  let application;
  try {
    application = await getApplication(applicationId);
  } catch {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  const apps = await getApplications();
  const batch = assessBatch(apps);
  const assessment = batch.assessments.find(
    (a) => a.applicationId === applicationId,
  );
  if (!assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  const idx = batch.assessments.findIndex(
    (a) => a.applicationId === applicationId,
  );
  const neighborAbove =
    idx > 0 ? (batch.assessments[idx - 1]?.companyName ?? null) : null;

  const ctx = buildReviewerChatContext(assessment, application, neighborAbove);
  const question = lastUser.content.trim();
  const key = geminiApiKey();

  const recent = messages.slice(-12);
  const lastUserIndex = recent.reduce(
    (acc, m, i) => (m.role === "user" ? i : acc),
    -1,
  );
  const history = recent.map((m, i) => {
    const raw = m.content.slice(0, 4000);
    const text =
      i === lastUserIndex && m.role === "user"
        ? wrapReviewerTurn(raw)
        : raw;
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text }],
    };
  });

  return sseResponse(async (send, signal) => {
    let mode: "gemini" | "local" = key ? "gemini" : "local";

    if (!key) {
      const text = localAssistantReply(question, ctx);
      send({ type: "meta", mode: "local", company: ctx.company.name });
      for (const part of chunkForSse(text)) {
        if (signal.aborted) return;
        send({ type: "token", text: part });
      }
      send({ type: "done", mode: "local" });
      return;
    }

    send({ type: "meta", mode: "gemini", company: ctx.company.name });

    let answer = "";
    try {
      const live = await geminiAnswer(key, history, ctx, signal);
      if (live.text && !live.cutOff) {
        answer = live.text;
      } else {
        mode = "local";
        answer = localAssistantReply(question, ctx);
        send({
          type: "meta",
          mode: "local",
          notice: live.cutOff
            ? "Live model cut off. Answering from engine facts."
            : "Empty model reply. Answering from engine facts.",
        });
      }
    } catch (err) {
      if (signal.aborted) return;
      const message = err instanceof Error ? err.message : "Chat failed";
      console.error(`[reviewer-chat] ${message}`);
      mode = "local";
      answer = localAssistantReply(question, ctx);
      send({
        type: "meta",
        mode: "local",
        notice: "Live model unavailable. Answering from engine facts.",
      });
    }

    if (signal.aborted) return;

    for (const part of chunkForSse(answer)) {
      if (signal.aborted) return;
      send({ type: "token", text: part });
    }
    send({ type: "done", mode });
  }, request.signal);
}
