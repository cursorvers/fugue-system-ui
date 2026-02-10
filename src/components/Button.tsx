"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg" | "icon";
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
    "inline-flex items-center justify-center gap-2 font-primary text-sm font-medium rounded-[var(--radius-m)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 shadow-[var(--shadow-xs)]",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:brightness-95",
    outline:
      "bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--secondary)]",
    ghost: "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]",
    destructive: "bg-[var(--destructive)] text-white hover:brightness-110",
  };

  const sizes = {
    sm: "min-h-[44px] h-8 px-3 text-xs",
    default: "min-h-[44px] h-9 px-4",
    lg: "min-h-[44px] h-10 px-5",
    icon: "min-h-[44px] min-w-[44px] h-8 w-8 p-0",
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
