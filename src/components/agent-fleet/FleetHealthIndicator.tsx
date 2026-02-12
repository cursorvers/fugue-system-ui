"use client";

import { Badge } from "@/components/Badge";
import type { FleetHealth } from "@/types/fleet";

interface FleetHealthIndicatorProps {
  readonly health: FleetHealth;
  readonly compact?: boolean;
  readonly className?: string;
}

const statusConfig: Record<FleetHealth["overallStatus"], {
  icon: string;
  variant: "success" | "warning" | "error";
  label: string;
}> = {
  healthy: { icon: "check_circle", variant: "success", label: "Healthy" },
  degraded: { icon: "warning", variant: "warning", label: "Degraded" },
  critical: { icon: "error", variant: "error", label: "Critical" },
};

export function FleetHealthIndicator({
  health,
  compact = false,
  className = "",
}: FleetHealthIndicatorProps) {
  const sc = statusConfig[health.overallStatus];

  if (compact) {
    return (
      <Badge variant={sc.variant} dot className={className}>
        {sc.label}
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`material-symbols-sharp text-[20px]`} style={{
        color: `var(--color-${sc.variant}-foreground)`,
      }}>
        {sc.icon}
      </span>
      <div className="flex items-center gap-2">
        <Badge variant={sc.variant}>{sc.label}</Badge>
        <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
          {health.activeAgents}/{health.totalAgents} active
        </span>
        {health.avgLatencyMs > 0 && (
          <span className="text-[11px] font-secondary text-[var(--muted-foreground)]">
            · {health.avgLatencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}
