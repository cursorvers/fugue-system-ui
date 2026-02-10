"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: "errors", label: "Errors", description: "Critical errors and failures", enabled: true },
    { id: "warnings", label: "Warnings", description: "Warnings and potential issues", enabled: true },
    { id: "tasks", label: "Task Updates", description: "When tasks complete or fail", enabled: true },
    { id: "agents", label: "Agent Status", description: "Agent online/offline changes", enabled: false },
  ]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="settings" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="settings" />

          <div className="flex-1 p-4 lg:p-10 overflow-auto">
            <div className="mb-4 lg:mb-6">
              <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                Notification Settings
              </h1>
              <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                Choose what notifications you receive
              </p>
            </div>

            <Card className="max-w-md">
              <CardHeader>
                <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                  Notification Types
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {settings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {setting.label}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {setting.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleSetting(setting.id)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          setting.enabled
                            ? "bg-[var(--primary)]"
                            : "bg-[var(--muted)]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            setting.enabled ? "left-6" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
