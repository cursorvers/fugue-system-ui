"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import type { ExecutionPlan, ExecutionStep } from "@/types/orchestration";

interface ExecutionPlanCardProps {
  readonly plan: ExecutionPlan;
  readonly onApprove: (planId: string) => void;
  readonly onReject: (planId: string, reason?: string) => void;
  readonly onDismiss?: (planId: string) => void;
}

const modeConfig: Record<ExecutionPlan["mode"], { label: string; variant: "info" | "warning" | "error" }> = {
  tutti: { label: "Tutti (6P)", variant: "info" },
  forte: { label: "Forte (2×)", variant: "warning" },
  max: { label: "MAX (9P)", variant: "error" },
};

const stepStatusIcon: Record<ExecutionStep["status"], { icon: string; color: string }> = {
  pending: { icon: "radio_button_unchecked", color: "text-[var(--muted-foreground)]" },
  running: { icon: "progress_activity", color: "text-[var(--primary)]" },
  completed: { icon: "check_circle", color: "text-[var(--color-success-foreground)]" },
  failed: { icon: "cancel", color: "text-[var(--color-error-foreground)]" },
  skipped: { icon: "skip_next", color: "text-[var(--muted-foreground)]" },
};

const statusConfig: Record<ExecutionPlan["status"], { label: string; variant: "success" | "warning" | "error" | "info" | "secondary" }> = {
  pending: { label: "承認待ち", variant: "warning" },
  approved: { label: "承認済み", variant: "success" },
  rejected: { label: "却下", variant: "error" },
  executing: { label: "実行中", variant: "info" },
  completed: { label: "完了", variant: "success" },
  failed: { label: "失敗", variant: "error" },
};

export function ExecutionPlanCard({
  plan,
  onApprove,
  onReject,
  onDismiss,
}: ExecutionPlanCardProps) {
  const [expanded, setExpanded] = useState(plan.status === "pending");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const mc = modeConfig[plan.mode];
  const sc = statusConfig[plan.status];
  const completedSteps = plan.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;

  const handleReject = useCallback(() => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    onReject(plan.id, rejectReason || undefined);
    setShowRejectInput(false);
    setRejectReason("");
  }, [showRejectInput, plan.id, rejectReason, onReject]);

  const isPending = plan.status === "pending";
  const isDone = plan.status === "completed" || plan.status === "failed" || plan.status === "rejected";

  return (
    <div className="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--secondary)] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-sharp text-[20px] text-[var(--primary)]">
            account_tree
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-primary font-medium text-[var(--foreground)] truncate">
              {plan.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={mc.variant} className="text-[10px]">{mc.label}</Badge>
              <Badge variant={sc.variant} className="text-[10px]">{sc.label}</Badge>
              <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
                {completedSteps}/{plan.steps.length} steps
              </span>
            </div>
          </div>
        </div>
        <span className={`material-symbols-sharp text-[18px] text-[var(--muted-foreground)] transition-transform ${expanded ? "rotate-180" : ""}`}>
          expand_more
        </span>
      </button>

      {/* Steps list */}
      {expanded && (
        <div className="border-t border-[var(--border)]">
          <div className="px-4 py-2 space-y-1">
            {plan.steps.map((step, i) => {
              const si = stepStatusIcon[step.status];
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-2.5 py-1.5"
                >
                  <div className="flex flex-col items-center mt-0.5">
                    <span className={`material-symbols-sharp text-[16px] ${si.color}`}>
                      {si.icon}
                    </span>
                    {i < plan.steps.length - 1 && (
                      <div className="w-px h-3 bg-[var(--border)] mt-0.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-primary text-[var(--foreground)]">
                      {step.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {step.agent && (
                        <span className="text-[10px] font-secondary text-[var(--primary)]">
                          {step.agent}
                        </span>
                      )}
                      {step.provider && (
                        <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
                          ({step.provider})
                        </span>
                      )}
                      {step.estimatedTokens && (
                        <span className="text-[10px] font-secondary text-[var(--muted-foreground)]">
                          ~{(step.estimatedTokens / 1000).toFixed(1)}k tok
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reject reason input */}
          {showRejectInput && isPending && (
            <div className="px-4 pb-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="却下理由（任意）"
                className="w-full px-3 py-2 min-h-[36px] text-[12px] font-primary rounded-[var(--radius-s)] bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[var(--border)] bg-[var(--secondary)]/30">
            {isPending && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                >
                  <span className="material-symbols-sharp text-[16px]">close</span>
                  却下
                </Button>
                <button
                  type="button"
                  onClick={() => onApprove(plan.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-[var(--radius-s)] bg-[var(--color-success-foreground)] text-white text-[12px] font-primary font-medium hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-sharp text-[16px]">check</span>
                  承認・実行
                </button>
              </>
            )}
            {isDone && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(plan.id)}
              >
                <span className="material-symbols-sharp text-[16px]">close</span>
                閉じる
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
