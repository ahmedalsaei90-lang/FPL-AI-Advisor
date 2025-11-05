"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ThemeBackgroundProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Shared backdrop used across dashboard-themed pages.
 * Renders the gradient pitch along with animated glow orbs.
 */
export function ThemeBackground({
  children,
  className,
  contentClassName,
}: ThemeBackgroundProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-pitch relative overflow-hidden",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}

