"use client";

import { useState, useCallback } from "react";
import type { ExecutionPlan, ExecutionStep } from "@/types/orchestration";

interface UseExecutionPlanReturn {
  readonly plans: readonly ExecutionPlan[];
  readonly activePlan: ExecutionPlan | null;
  readonly addPlan: (plan: ExecutionPlan) => void;
  readonly approvePlan: (planId: string) => void;
  readonly rejectPlan: (planId: string, reason?: string) => void;
  readonly updateStepStatus: (planId: string, stepId: string, status: ExecutionStep["status"]) => void;
  readonly dismissPlan: (planId: string) => void;
}

export function useExecutionPlan(
  onApprove?: (planId: string) => void,
  onReject?: (planId: string, reason?: string) => void
): UseExecutionPlanReturn {
  const [plans, setPlans] = useState<readonly ExecutionPlan[]>([]);

  const activePlan = plans.find((p) => p.status === "pending") ?? null;

  const addPlan = useCallback((plan: ExecutionPlan) => {
    setPlans((prev) => {
      // Upsert: replace existing plan with same id, append if new
      const idx = prev.findIndex((p) => p.id === plan.id);
      if (idx >= 0) {
        return [...prev.slice(0, idx), plan, ...prev.slice(idx + 1)];
      }
      return [...prev, plan];
    });
  }, []);

  const approvePlan = useCallback(
    (planId: string) => {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, status: "approved" as const, approvedAt: new Date().toISOString() }
            : p
        )
      );
      onApprove?.(planId);
    },
    [onApprove]
  );

  const rejectPlan = useCallback(
    (planId: string, reason?: string) => {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, status: "rejected" as const, rejectedReason: reason }
            : p
        )
      );
      onReject?.(planId, reason);
    },
    [onReject]
  );

  const TERMINAL_STATUSES = new Set(["completed", "failed", "rejected"]);

  const updateStepStatus = useCallback(
    (planId: string, stepId: string, status: ExecutionStep["status"]) => {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== planId) return p;
          // Guard: do not mutate plans in terminal state
          if (TERMINAL_STATUSES.has(p.status)) return p;

          const updatedSteps = p.steps.map((s) =>
            s.id === stepId ? { ...s, status } : s
          );
          const allDone = updatedSteps.every(
            (s) => s.status === "completed" || s.status === "failed" || s.status === "skipped"
          );
          const anyFailed = updatedSteps.some((s) => s.status === "failed");
          const planStatus = allDone
            ? anyFailed ? "failed" as const : "completed" as const
            : "executing" as const;
          return { ...p, steps: updatedSteps, status: planStatus };
        })
      );
    },
    []
  );

  const dismissPlan = useCallback((planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  }, []);

  return {
    plans,
    activePlan,
    addPlan,
    approvePlan,
    rejectPlan,
    updateStepStatus,
    dismissPlan,
  };
}
