"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
    >
      <div className="w-12 h-12 rounded-[var(--radius-l)] bg-[var(--muted)] flex items-center justify-center mb-4">
        <span className="material-symbols-sharp text-[24px] text-[var(--muted-foreground)]">
          {icon}
        </span>
      </div>
      <h3 className="text-sm font-primary font-semibold text-[var(--foreground)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs font-secondary text-[var(--muted-foreground)] max-w-[280px] mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
