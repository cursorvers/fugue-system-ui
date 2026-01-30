"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "large";
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "default",
  size = "default",
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-primary text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90",
    outline:
      "bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--secondary)]",
    ghost: "text-[var(--foreground)] hover:bg-[var(--secondary)]",
    destructive: "bg-[var(--destructive)] text-white hover:opacity-90",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    large: "h-12 px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
