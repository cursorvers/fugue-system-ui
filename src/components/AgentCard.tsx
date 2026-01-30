"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";

interface AgentCardProps {
  name: string;
  description: string;
  status: "Online" | "Offline" | "Busy";
  color: string;
  stats: {
    tasksToday: number;
    successRate: string;
    avgTime: string;
  };
  className?: string;
}

export function AgentCard({
  name,
  description,
  status,
  color,
  stats,
  className,
}: AgentCardProps) {
  const statusVariant = {
    Online: "success" as const,
    Offline: "secondary" as const,
    Busy: "warning" as const,
  };

  return (
    <Card className={cn("flex-1", className)}>
      <CardContent className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              <span className="text-white font-primary font-bold text-sm">
                {name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-primary font-semibold text-[var(--foreground)]">
                {name}
              </h3>
              <p className="text-sm font-secondary text-[var(--muted-foreground)]">
                {description}
              </p>
            </div>
          </div>
          <Badge variant={statusVariant[status]}>{status}</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-secondary text-[var(--muted-foreground)]">
              Tasks Today
            </p>
            <p className="text-lg font-primary font-semibold text-[var(--foreground)]">
              {stats.tasksToday}
            </p>
          </div>
          <div>
            <p className="text-xs font-secondary text-[var(--muted-foreground)]">
              Success Rate
            </p>
            <p className="text-lg font-primary font-semibold text-[var(--color-success-foreground)]">
              {stats.successRate}
            </p>
          </div>
          <div>
            <p className="text-xs font-secondary text-[var(--muted-foreground)]">
              Avg Time
            </p>
            <p className="text-lg font-primary font-semibold text-[var(--foreground)]">
              {stats.avgTime}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
