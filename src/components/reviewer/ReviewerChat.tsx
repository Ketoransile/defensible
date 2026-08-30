"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

export interface ReviewerChatProps {
  applicationId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  pending?: boolean;
}

const SUGGESTIONS = [
  "Why this rank?",
  "What findings should I watch?",
  "Summarize growth and jobs",
  "Which criteria are unestablished?",
  "Walk me through eligibility",
] as const;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function renderRich(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) => {
      if (chunk.startsWith("**") && chunk.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold text-foreground">
            {chunk.slice(2, -2)}
          </strong>
        );
      }
      return <span key={j}>{chunk}</span>;
    });
    return (
      <span key={i} className="block min-h-[1.15em]">
        {parts}
      </span>
    );
  });
}

async function streamAssistant(params: {
  applicationId: string;
  messages: { role: Role; content: string }[];
  onMeta: (meta: { mode?: string; notice?: string }) => void;
  onToken: (text: string) => void;
  signal: AbortSignal;
}) {
  const res = await fetch("/api/reviewer-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId: params.applicationId,
      messages: params.messages,
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Chat failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  const onAbort = () => {
    void reader.cancel().catch(() => undefined);
  };
  if (params.signal.aborted) onAbort();
  else params.signal.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      if (params.signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const line = chunk.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        try {
          const payload = JSON.parse(line.slice(6)) as {
            type: string;
            text?: string;
            mode?: string;
            notice?: string;
          };
          if (payload.type === "meta") {
            params.onMeta({ mode: payload.mode, notice: payload.notice });
          } else if (payload.type === "token" && payload.text) {
            params.onToken(payload.text);
          } else if (payload.type === "error") {
            throw new Error(payload.text ?? "Assistant error");
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  } finally {
    params.signal.removeEventListener("abort", onAbort);
  }
}

export function ReviewerChat({
  applicationId,
  companyName,
  open,
  onOpenChange,
}: ReviewerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"gemini" | "local" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Remount via key={applicationId} in parent resets thread state.

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(t);
  }, [open, applicationId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;

    setError(null);
    setNotice(null);
    const userMsg: Message = { id: uid(), role: "user", content: q };
    const assistantId = uid();
    const pending: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      pending: true,
    };

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg, pending]);
    setInput("");
    setBusy(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await streamAssistant({
        applicationId,
        messages: history,
        signal: ac.signal,
        onMeta: (meta) => {
          if (meta.mode === "gemini" || meta.mode === "local") {
            setMode(meta.mode);
          }
          if (meta.notice) setNotice(meta.notice);
        },
        onToken: (text) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + text, pending: true }
                : m,
            ),
          );
        },
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, pending: false } : m,
        ),
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setMessages((prev) =>
        prev.filter((m) => m.id !== assistantId || m.content.length > 0),
      );
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={[
          "reviewer-chat-launcher",
          open ? "is-open" : "",
        ].join(" ")}
        aria-expanded={open}
        aria-controls="reviewer-chat-panel"
      >
        <span className="reviewer-chat-launcher-orb" aria-hidden />
        <span className="reviewer-chat-launcher-label">
          {open ? "Close" : "Ask AI"}
        </span>
      </button>

      {/* Panel */}
      <aside
        id="reviewer-chat-panel"
        className={["reviewer-chat-panel", open ? "is-open" : ""].join(" ")}
        aria-hidden={!open}
      >
        <header className="reviewer-chat-head">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
              Defensible assistant
              {mode ? (
                <span className="ml-2 text-muted normal-case tracking-normal">
                  · {mode === "gemini" ? "live model" : "engine facts"}
                </span>
              ) : null}
            </p>
            <h3 className="mt-0.5 truncate font-[family-name:var(--font-display)] text-[17px] tracking-tight">
              {companyName}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {messages.length > 0 && (
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-foreground"
                onClick={() => {
                  abortRef.current?.abort();
                  setMessages([]);
                  setError(null);
                  setNotice(null);
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              ✕
            </button>
          </div>
        </header>

        <div ref={scrollerRef} className="reviewer-chat-scroll">
          {messages.length === 0 ? (
            <div className="reviewer-chat-empty">
              <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                Interrogate this dossier
              </p>
              <p className="mt-2 text-[13px] leading-5 text-muted">
                Ask about rank, findings, eligibility, growth, jobs, or any
                criterion. Answers stay grounded in the scored application.
                Never invented points.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="reviewer-chat-chip"
                    onClick={() => void ask(s)}
                    disabled={busy}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={[
                    "reviewer-chat-bubble",
                    m.role === "user" ? "is-user" : "is-assistant",
                  ].join(" ")}
                >
                  <p className="mb-1 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                    {m.role === "user" ? "You" : "Assistant"}
                  </p>
                  <div className="text-[13px] leading-5 whitespace-pre-wrap">
                    {m.content ? renderRich(m.content) : null}
                    {m.pending && !m.content ? (
                      <span className="reviewer-chat-typing" aria-label="Thinking">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : null}
                    {m.pending && m.content ? (
                      <span className="reviewer-chat-caret" aria-hidden />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {notice ? (
            <p className="mt-3 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-[12px] text-warn">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="reviewer-chat-composer">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
            rows={2}
            placeholder={`Ask about ${companyName}…`}
            disabled={busy}
            className="reviewer-chat-input"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="reviewer-chat-send"
          >
            {busy ? "…" : "Send"}
          </button>
        </form>
      </aside>

      {open ? (
        <button
          type="button"
          className="reviewer-chat-backdrop"
          aria-label="Close assistant"
          onClick={() => onOpenChange(false)}
        />
      ) : null}
    </>
  );
}
