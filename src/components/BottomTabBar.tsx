"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabItem {
  readonly icon: string;
  readonly activeIcon: string;
  readonly label: string;
  readonly href: string;
}

const TABS: readonly TabItem[] = [
  { icon: "dashboard", activeIcon: "dashboard", label: "概要", href: "/" },
  { icon: "work", activeIcon: "work", label: "Work", href: "/work" },
  { icon: "chat", activeIcon: "chat", label: "Chat", href: "/chat" },
  { icon: "play_circle", activeIcon: "play_circle", label: "Runs", href: "/runs" },
  { icon: "settings", activeIcon: "settings", label: "設定", href: "/settings" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--card)] border-t border-[var(--border)]"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
      aria-label="メインナビゲーション"
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-w-[64px] min-h-[var(--bottom-tab-height)] transition-colors",
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted-foreground)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className="material-symbols-sharp text-[22px] leading-none"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                aria-hidden="true"
              >
                {active ? tab.activeIcon : tab.icon}
              </span>
              <span className="text-[10px] font-primary font-medium leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
