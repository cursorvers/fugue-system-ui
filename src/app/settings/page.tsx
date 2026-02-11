"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const SETTINGS_ITEMS = [
  {
    icon: "person",
    label: "Account",
    description: "Profile and connected services",
    href: "/settings/account",
  },
  {
    icon: "palette",
    label: "Appearance",
    description: "Theme and display preferences",
    href: "/settings/appearance",
  },
  {
    icon: "notifications",
    label: "Notifications",
    description: "Alert and notification settings",
    href: "/settings/notifications",
  },
  {
    icon: "help",
    label: "Help",
    description: "Documentation and support",
    href: "/settings/help",
  },
] as const;

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="settings" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="settings" />

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            <div className="mb-4 lg:mb-6">
              <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                Settings
              </h1>
              <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                Manage your preferences
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              {SETTINGS_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-4 rounded-[var(--radius-l)] bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors min-h-[44px]"
                >
                  <span className="material-symbols-sharp text-[20px] text-[var(--primary)]">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-primary font-medium text-[var(--foreground)]">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-primary text-[var(--muted-foreground)] truncate">
                      {item.description}
                    </p>
                  </div>
                  <span className="material-symbols-sharp text-[16px] text-[var(--muted-foreground)] ml-auto flex-shrink-0">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
