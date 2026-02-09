"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useTheme } from "@/contexts/ThemeContext";

function AppearanceContent() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 p-4 lg:p-10 overflow-auto">
        <div className="mb-4 lg:mb-6">
          <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
            Appearance
          </h1>
          <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-10 overflow-auto">
      <div className="mb-4 lg:mb-6">
        <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
          Appearance
        </h1>
        <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
          Customize the look and feel
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
            Theme
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button
              onClick={() => setTheme("dark")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                theme === "dark"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] hover:bg-[var(--sidebar)]"
              }`}
            >
              <span className="material-symbols-sharp text-[var(--foreground)]">dark_mode</span>
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--foreground)]">Dark</p>
                <p className="text-xs text-[var(--muted-foreground)]">Easy on the eyes</p>
              </div>
              {theme === "dark" && (
                <span className="material-symbols-sharp text-[var(--primary)] ml-auto">check</span>
              )}
            </button>

            <button
              onClick={() => setTheme("light")}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                theme === "light"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "border-[var(--border)] hover:bg-[var(--sidebar)]"
              }`}
            >
              <span className="material-symbols-sharp text-[var(--foreground)]">light_mode</span>
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--foreground)]">Light</p>
                <p className="text-xs text-[var(--muted-foreground)]">Classic bright theme</p>
              </div>
              {theme === "light" && (
                <span className="material-symbols-sharp text-[var(--primary)] ml-auto">check</span>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppearanceSettingsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--background)] overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar activePage="settings" />
        </div>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MobileNav activePage="settings" />
          <AppearanceContent />
        </main>
      </div>
    </ProtectedRoute>
  );
}
