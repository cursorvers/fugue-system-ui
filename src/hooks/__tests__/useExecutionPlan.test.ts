import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExecutionPlan } from "../useExecutionPlan";
import type { ExecutionPlan } from "@/types/orchestration";

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  return {
    id: "plan-1",
    title: "Test Plan",
    mode: "tutti",
    steps: [
      { id: "step-1", label: "Step 1", status: "pending" },
      { id: "step-2", label: "Step 2", status: "pending" },
    ],
    status: "pending",
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("useExecutionPlan", () => {
  it("starts with empty plans", () => {
    const { result } = renderHook(() => useExecutionPlan());
    expect(result.current.plans).toEqual([]);
    expect(result.current.activePlan).toBeNull();
  });

  it("adds a plan", () => {
    const { result } = renderHook(() => useExecutionPlan());
    const plan = createPlan();
    act(() => result.current.addPlan(plan));
    expect(result.current.plans).toHaveLength(1);
    expect(result.current.plans[0].id).toBe("plan-1");
  });

  it("upserts existing plan", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan({ title: "Original" })));
    act(() => result.current.addPlan(createPlan({ title: "Updated" })));
    expect(result.current.plans).toHaveLength(1);
    expect(result.current.plans[0].title).toBe("Updated");
  });

  it("returns activePlan as first pending plan", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan()));
    expect(result.current.activePlan?.id).toBe("plan-1");
  });

  it("approves a plan and calls onApprove", () => {
    const onApprove = vi.fn();
    const { result } = renderHook(() => useExecutionPlan(onApprove));
    act(() => result.current.addPlan(createPlan()));
    act(() => result.current.approvePlan("plan-1"));
    expect(result.current.plans[0].status).toBe("approved");
    expect(onApprove).toHaveBeenCalledWith("plan-1");
  });

  it("rejects a plan with reason", () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const { result } = renderHook(() => useExecutionPlan(onApprove, onReject));
    act(() => result.current.addPlan(createPlan()));
    act(() => result.current.rejectPlan("plan-1", "Too risky"));
    expect(result.current.plans[0].status).toBe("rejected");
    expect(result.current.plans[0].rejectedReason).toBe("Too risky");
    expect(onReject).toHaveBeenCalledWith("plan-1", "Too risky");
  });

  it("updates step status", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan({ status: "approved" })));
    act(() => result.current.updateStepStatus("plan-1", "step-1", "running"));
    expect(result.current.plans[0].steps[0].status).toBe("running");
    expect(result.current.plans[0].status).toBe("executing");
  });

  it("marks plan as completed when all steps complete", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan({ status: "approved" })));
    act(() => result.current.updateStepStatus("plan-1", "step-1", "completed"));
    act(() => result.current.updateStepStatus("plan-1", "step-2", "completed"));
    expect(result.current.plans[0].status).toBe("completed");
  });

  it("marks plan as failed when any step fails", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan({ status: "approved" })));
    act(() => result.current.updateStepStatus("plan-1", "step-1", "completed"));
    act(() => result.current.updateStepStatus("plan-1", "step-2", "failed"));
    expect(result.current.plans[0].status).toBe("failed");
  });

  it("does not update steps on terminal plan", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan({ status: "completed" as any })));
    act(() => result.current.updateStepStatus("plan-1", "step-1", "running"));
    // Should remain unchanged
    expect(result.current.plans[0].steps[0].status).toBe("pending");
  });

  it("dismisses a plan", () => {
    const { result } = renderHook(() => useExecutionPlan());
    act(() => result.current.addPlan(createPlan()));
    act(() => result.current.dismissPlan("plan-1"));
    expect(result.current.plans).toHaveLength(0);
  });
});
