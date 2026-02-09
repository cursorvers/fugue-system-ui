"use client";

import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardHeader, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountSettingsPage() {
  const { user } = useAuth();

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
                Account
              </h1>
              <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                Manage your account settings
              </p>
            </div>

            <div className="space-y-4 max-w-md">
              <Card>
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Profile
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {user?.name?.charAt(0) || "G"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {user?.name || "Guest User"}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {user?.email || "guest@fugue.local"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--muted-foreground)]">Role</span>
                        <Badge variant="success">Orchestrator</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="font-primary text-sm lg:text-base font-semibold text-[var(--foreground)]">
                    Connected Services
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-sharp text-[var(--foreground)]">cloud</span>
                        <span className="text-sm text-[var(--foreground)]">Cloudflare Workers</span>
                      </div>
                      <Badge variant="success">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-sharp text-[var(--foreground)]">smart_toy</span>
                        <span className="text-sm text-[var(--foreground)]">OpenAI Codex</span>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
