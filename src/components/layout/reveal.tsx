import type { ReactNode } from "react";

/**
 * Layout wrapper kept as a stable seam for section reveals.
 *
 * Decision (see docs/site-rebuild-plan.md): scroll-triggered content hiding
 * was removed deliberately — an industrial B2B site must keep every section
 * readable without JS, on print, and in headless captures. Hover/focus
 * transitions in globals.css provide the (subtle) motion layer instead.
 * This component renders children directly and stays client-free.
 */
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "figure" | "li" | "article";
}) {
  return (
    <Tag className={className || undefined}>{children}</Tag>
  );
}
