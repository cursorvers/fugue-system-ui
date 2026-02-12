"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface State {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <span className="material-symbols-sharp text-[48px] text-[var(--color-error-foreground)] mb-4">
            error
          </span>
          <h2 className="text-lg font-primary font-semibold text-[var(--foreground)] mb-2">
            エラーが発生しました
          </h2>
          <p className="text-sm font-secondary text-[var(--muted-foreground)] mb-4 max-w-md">
            {this.state.error?.message ?? "予期しないエラーです"}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-[var(--radius-m)] bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-primary hover:opacity-90 transition-opacity"
          >
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
