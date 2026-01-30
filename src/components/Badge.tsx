"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info" | "secondary";
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const variants = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    success: "bg-[var(--color-success)] text-[var(--color-success-foreground)]",
    warning: "bg-[var(--color-warning)] text-[var(--color-warning-foreground)]",
    error: "bg-[var(--color-error)] text-[var(--color-error-foreground)]",
    info: "bg-[var(--color-info)] text-[var(--color-info-foreground)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2 py-1 text-sm font-primary rounded-full",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
