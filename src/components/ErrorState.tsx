"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
    >
      <div className="w-12 h-12 rounded-[var(--radius-l)] bg-[var(--color-error)] flex items-center justify-center mb-4">
        <span className="material-symbols-sharp text-[24px] text-[var(--color-error-foreground)]">
          error
        </span>
      </div>
      <h3 className="text-sm font-primary font-semibold text-[var(--foreground)] mb-1">
        {title}
      </h3>
      <p className="text-xs font-secondary text-[var(--muted-foreground)] max-w-[320px] mb-4">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <span className="material-symbols-sharp text-[14px]">refresh</span>
          Retry
        </Button>
      )}
    </div>
  );
}
