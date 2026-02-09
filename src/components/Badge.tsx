"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "secondary" | "outline";
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = "default", children, className, dot }: BadgeProps) {
  const variants = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    success: "bg-[var(--color-success)] text-[var(--color-success-foreground)]",
    warning: "bg-[var(--color-warning)] text-[var(--color-warning-foreground)]",
    error: "bg-[var(--color-error)] text-[var(--color-error-foreground)]",
    info: "bg-[var(--color-info)] text-[var(--color-info-foreground)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
    outline: "bg-transparent border border-[var(--border)] text-[var(--muted-foreground)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-primary font-medium rounded-[var(--radius-s)]",
        variants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full flex-shrink-0",
          variant === "success" ? "bg-[var(--color-success-foreground)]" :
          variant === "error" ? "bg-[var(--color-error-foreground)]" :
          variant === "warning" ? "bg-[var(--color-warning-foreground)]" :
          "bg-current"
        )} />
      )}
      {children}
    </span>
  );
}
