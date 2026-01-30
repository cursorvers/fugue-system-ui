"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-sm", gap: "gap-1.5" },
    md: { icon: 32, text: "text-lg", gap: "gap-2" },
    lg: { icon: 40, text: "text-xl", gap: "gap-2.5" },
  };

  const s = sizes[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <LogoIcon size={s.icon} />
      {showText && (
        <span className={cn("font-primary font-bold tracking-tight", s.text)}>
          <span className="text-[var(--primary)]">FU</span>
          <span className="text-[var(--foreground)]">GUE</span>
        </span>
      )}
    </div>
  );
}

function LogoIcon({ size }: { size: number }) {
  const center = size / 2;
  const outerRadius = size * 0.4;
  const innerRadius = size * 0.22;
  const nodeRadius = size * 0.06;
  const lineWidth = size * 0.04;

  // Calculate node positions (top, right, bottom, left)
  const nodes = [
    { x: center, y: center - outerRadius }, // top
    { x: center + outerRadius, y: center }, // right
    { x: center, y: center + outerRadius }, // bottom
    { x: center - outerRadius, y: center }, // left
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Connection lines */}
      {nodes.map((node, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={node.x}
          y2={node.y}
          stroke="var(--primary)"
          strokeWidth={lineWidth}
          strokeLinecap="round"
          opacity={0.6}
        />
      ))}

      {/* Center hub - gradient */}
      <defs>
        <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#CC6A00" />
        </radialGradient>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={innerRadius}
        fill="url(#hubGradient)"
      />

      {/* Outer nodes */}
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill="var(--muted-foreground)"
          opacity={0.8}
        />
      ))}

      {/* Center highlight */}
      <circle
        cx={center - innerRadius * 0.3}
        cy={center - innerRadius * 0.3}
        r={innerRadius * 0.2}
        fill="white"
        opacity={0.3}
      />
    </svg>
  );
}

// Animated version for loading states
export function LogoAnimated({ size = "md", className }: Omit<LogoProps, "showText">) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const s = sizes[size];
  const center = s / 2;
  const outerRadius = s * 0.4;
  const innerRadius = s * 0.22;
  const nodeRadius = s * 0.06;
  const lineWidth = s * 0.04;

  const nodes = [
    { x: center, y: center - outerRadius },
    { x: center + outerRadius, y: center },
    { x: center, y: center + outerRadius },
    { x: center - outerRadius, y: center },
  ];

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0 animate-spin", className)}
      style={{ animationDuration: "3s" }}
    >
      {nodes.map((node, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={node.x}
          y2={node.y}
          stroke="var(--primary)"
          strokeWidth={lineWidth}
          strokeLinecap="round"
          opacity={0.6}
        />
      ))}

      <defs>
        <radialGradient id="hubGradientAnim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#CC6A00" />
        </radialGradient>
      </defs>
      <circle cx={center} cy={center} r={innerRadius} fill="url(#hubGradientAnim)" />

      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={nodeRadius}
          fill="var(--muted-foreground)"
          opacity={0.8}
        >
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${i * 0.375}s`}
          />
        </circle>
      ))}
    </svg>
  );
}
