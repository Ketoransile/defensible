import { cookies } from "next/headers";
import { GoogleGenAI } from "@google/genai";
import { assessBatch, geminiApiKey } from "@/engine";
import { getApplication, getApplications } from "@/lib/applicationsRepo";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import {
  buildReviewerChatContext,
  chatSystemPrompt,
  localAssistantReply,
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

  const encoder = new TextEncoder();

  if (!key) {
    const text = localAssistantReply(question, ctx);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(sse({ type: "meta", mode: "local", company: ctx.company.name })),
        );
        // Chunk for a streaming feel even offline
        const parts = text.split(/(?<=\s)/);
        for (const part of parts) {
          controller.enqueue(encoder.encode(sse({ type: "token", text: part })));
        }
        controller.enqueue(encoder.encode(sse({ type: "done", mode: "local" })));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const history = messages
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 4000) }],
    }));

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(sse(payload)));

      try {
        send({ type: "meta", mode: "gemini", company: ctx.company.name });
        const ai = new GoogleGenAI({ apiKey: key });
        const gen = await ai.models.generateContentStream({
          model: MODEL,
          contents: history,
          config: {
            temperature: 0.35,
            systemInstruction: chatSystemPrompt(ctx),
            maxOutputTokens: 1024,
          },
        });

        for await (const chunk of gen) {
          const text = chunk.text;
          if (text) send({ type: "token", text });
        }
        send({ type: "done", mode: "gemini" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chat failed";
        console.error(`[reviewer-chat] ${message}`);
        // Graceful degrade to local facts
        const fallback = localAssistantReply(question, ctx);
        send({
          type: "meta",
          mode: "local",
          notice: "Live model unavailable — answering from engine facts.",
        });
        send({ type: "token", text: fallback });
        send({ type: "done", mode: "local" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
