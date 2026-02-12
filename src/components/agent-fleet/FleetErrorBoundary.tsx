"use client";

import { Component, type ReactNode } from "react";
import { reportError } from "@/lib/error-reporter";

interface FleetErrorBoundaryProps {
  readonly children: ReactNode;
}

interface FleetErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

/**
 * Error boundary for @xyflow/react DependencyGraph crashes.
 * Shows a local fallback UI instead of crashing the entire page.
 */
export class FleetErrorBoundary extends Component<FleetErrorBoundaryProps, FleetErrorBoundaryState> {
  constructor(props: FleetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FleetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    reportError(error, { component: "FleetErrorBoundary", action: "render" });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
          <span className="material-symbols-sharp text-[32px] text-[var(--color-warning-foreground)]">
            error_outline
          </span>
          <p className="text-[13px] font-primary font-medium text-[var(--foreground)]">
            グラフの描画中にエラーが発生しました
          </p>
          <p className="text-[11px] font-secondary text-[var(--muted-foreground)] text-center max-w-xs">
            {this.state.error?.message ?? "不明なエラー"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-[var(--radius-m)] border border-[var(--border)] text-[12px] font-primary font-medium text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            <span className="material-symbols-sharp text-[16px]">refresh</span>
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
