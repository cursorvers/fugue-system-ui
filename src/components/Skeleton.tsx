"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-m)] bg-[var(--muted)]",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-[var(--radius-l)] bg-[var(--card)] border border-[var(--border)] p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-2.5 w-12" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn("rounded-[var(--radius-l)] bg-[var(--card)] border border-[var(--border)] overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)]">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] last:border-0">
          <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-5 w-16 rounded-[var(--radius-s)]" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonAgentList({ count = 5, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="w-8 h-8 rounded-[var(--radius-m)] flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-14" />
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="h-2.5 w-6 ml-auto" />
            <Skeleton className="h-2 w-8 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
