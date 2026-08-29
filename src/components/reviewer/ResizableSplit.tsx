"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type Axis = "horizontal" | "vertical";

interface ResizableSplitProps {
  axis: Axis;
  /** First pane size as a percentage of the container (0–100). */
  initial: number;
  min?: number;
  max?: number;
  storageKey?: string;
  first: ReactNode;
  second: ReactNode;
  className?: string;
}

function readStored(key: string | undefined, fallback: number): number {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string | undefined, value: number) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

function Pane({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      {children}
    </div>
  );
}

export function ResizableSplit({
  axis,
  initial,
  min = 18,
  max = 82,
  storageKey,
  first,
  second,
  className = "",
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(() => readStored(storageKey, initial));
  const sizeRef = useRef(size);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const clamp = useCallback(
    (value: number) => Math.min(max, Math.max(min, value)),
    [min, max],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next =
      axis === "horizontal"
        ? ((event.clientX - rect.left) / rect.width) * 100
        : ((event.clientY - rect.top) / rect.height) * 100;
    const clamped = clamp(next);
    sizeRef.current = clamped;
    setSize(clamped);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    writeStored(storageKey, sizeRef.current);
  };

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.cursor;
    const select = document.body.style.userSelect;
    document.body.style.cursor =
      axis === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = prev;
      document.body.style.userSelect = select;
    };
  }, [dragging, axis]);

  const isHorizontal = axis === "horizontal";

  return (
    <div
      ref={containerRef}
      className={[
        "flex h-full w-full min-h-0 min-w-0",
        isHorizontal ? "flex-row" : "flex-col",
        dragging ? "select-none" : "",
        className,
      ].join(" ")}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={
          isHorizontal
            ? { flex: `0 0 ${size}%`, width: `${size}%`, maxWidth: `${size}%` }
            : {
                flex: `0 0 ${size}%`,
                height: `${size}%`,
                maxHeight: `${size}%`,
              }
        }
      >
        <Pane>{first}</Pane>
      </div>

      <div
        role="separator"
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 5 : 2;
          const apply = (delta: number) => {
            setSize((s) => {
              const n = clamp(s + delta);
              sizeRef.current = n;
              writeStored(storageKey, n);
              return n;
            });
          };
          if (isHorizontal) {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              apply(-step);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              apply(step);
            }
          } else {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              apply(-step);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              apply(step);
            }
          }
        }}
        className={[
          "group relative z-20 shrink-0 touch-none outline-none",
          isHorizontal ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize",
          "bg-border hover:bg-accent/50 focus-visible:bg-accent/60",
          dragging ? "bg-accent/70" : "",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none absolute rounded-full bg-border-strong opacity-70 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            dragging ? "bg-accent opacity-100" : "",
            isHorizontal
              ? "top-1/2 left-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2"
              : "top-1/2 left-1/2 h-0.5 w-8 -translate-x-1/2 -translate-y-1/2",
          ].join(" ")}
        />
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Pane>{second}</Pane>
      </div>
    </div>
  );
}
