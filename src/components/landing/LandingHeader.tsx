"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./LandingPage.module.css";

export function LandingHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[styles.headerWrap, scrolled ? styles.headerScrolled : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </header>
  );
}
