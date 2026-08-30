import type { ReactNode } from "react";
import styles from "./LandingPage.module.css";

export function LandingHeader({ children }: { children: ReactNode }) {
  return (
    <>
      <header className={styles.headerWrap}>{children}</header>
      <div className={styles.headerSpacer} aria-hidden />
    </>
  );
}
