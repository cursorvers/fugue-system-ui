"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-m)] overflow-hidden",
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
    <div className={cn("px-5 py-4 border-b border-[var(--border)]", className)}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

interface CardActionsProps {
  children: ReactNode;
  className?: string;
}

export function CardActions({ children, className }: CardActionsProps) {
  return (
    <div className={cn("px-5 py-4 border-t border-[var(--border)]", className)}>
      {children}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}

export function MetricCard({ label, value, valueColor, className }: MetricCardProps) {
  return (
    <Card className={cn("flex-1", className)}>
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs font-secondary text-[var(--muted-foreground)]">
          {label}
        </span>
        <span
          className="text-2xl font-primary font-semibold"
          style={{ color: valueColor || "var(--foreground)" }}
        >
          {value}
        </span>
      </CardContent>
    </Card>
  );
}
