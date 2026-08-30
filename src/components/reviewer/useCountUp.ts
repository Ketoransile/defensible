"use client";

import { useEffect, useState } from "react";

/**
 * Ease-out count from 0 → target. Instant when the user prefers reduced motion.
 */
export function useCountUp(
  target: number,
  { duration = 720, delay = 0 }: { duration?: number; delay?: number } = {},
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || duration <= 0) {
      const idle = window.setTimeout(() => setValue(target), 0);
      return () => window.clearTimeout(idle);
    }

    let raf = 0;
    let start = 0;
    const wait = window.setTimeout(() => {
      start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        setValue(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return value;
}
