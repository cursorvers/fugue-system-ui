"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}

export function Card({ children, className, glass }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-l)] overflow-hidden",
        glass
          ? "glass"
          : "bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("px-4 py-3 border-b border-[var(--border)]", className)}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>;
}

interface CardActionsProps {
  children: ReactNode;
  className?: string;
}

export function CardActions({ children, className }: CardActionsProps) {
  return (
    <div className={cn("px-4 py-3 border-t border-[var(--border)]", className)}>
      {children}
    </div>
  );
}

// Metric Card — compact, dense layout
interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: string;
  className?: string;
}

export function MetricCard({ label, value, change, changeType = "neutral", icon, className }: MetricCardProps) {
  const changeColors = {
    positive: "text-[var(--color-success-foreground)]",
    negative: "text-[var(--color-error-foreground)]",
    neutral: "text-[var(--muted-foreground)]",
  };

  return (
    <Card className={cn("flex-1", className)}>
      <CardContent className="flex flex-col gap-1.5 py-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-primary font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            {label}
          </span>
          {icon && (
            <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)]">
              {icon}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-secondary font-semibold text-[var(--foreground)]">
            {value}
          </span>
          {change && (
            <span className={cn("text-[11px] font-secondary", changeColors[changeType])}>
              {change}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
