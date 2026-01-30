"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Notification {
  id: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  read: boolean;
  details?: string;
  stackTrace?: string;
  metadata?: Record<string, string>;
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fugue-notifications");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((n: Notification) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
        } catch {
          return getDefaultNotifications();
        }
      }
    }
    return getDefaultNotifications();
  });

  const [filter, setFilter] = useState<"all" | "error" | "warning" | "info" | "success">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    localStorage.setItem("fugue-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || n.type === filter
  );

  const handleSelectNotification = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    // Open detail
    setSelectedNotification(notification);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotification(null);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const errorCount = notifications.filter((n) => n.type === "error").length;

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activePage="logs" />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <MobileNav activePage="notifications" />

        <div className="flex-1 flex flex-col p-4 lg:p-10 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="mb-4 lg:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h1 className="font-primary text-xl lg:text-2xl font-semibold text-[var(--foreground)]">
                  System Notifications
                </h1>
                <p className="text-xs lg:text-sm text-[var(--muted-foreground)] mt-1">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : "All caught up!"}
                  {errorCount > 0 && (
                    <span className="text-red-500 ml-2">
                      ({errorCount} error{errorCount > 1 ? "s" : ""})
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 text-xs lg:text-sm bg-[var(--sidebar)] text-[var(--foreground)] rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 text-xs lg:text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {(["all", "error", "warning", "info", "success"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 text-xs lg:text-sm rounded-lg whitespace-nowrap transition-colors ${
                    filter === type
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--sidebar)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== "all" && (
                    <span className="ml-1 opacity-70">
                      ({notifications.filter((n) => n.type === type).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto overscroll-contain p-3 lg:p-5">
              {filteredNotifications.length === 0 ? (
                <div className="text-center text-[var(--muted-foreground)] py-12">
                  <span className="material-symbols-sharp text-4xl mb-2 block opacity-50">
                    notifications_off
                  </span>
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onSelect={() => handleSelectNotification(notification)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onDelete={() => deleteNotification(selectedNotification.id)}
        />
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onSelect,
}: {
  notification: Notification;
  onSelect: () => void;
}) {
  const typeConfig = {
    error: {
      icon: "error",
      iconBg: "bg-red-500",
      badge: "error" as const,
    },
    warning: {
      icon: "warning",
      iconBg: "bg-yellow-500",
      badge: "warning" as const,
    },
    info: {
      icon: "info",
      iconBg: "bg-blue-500",
      badge: "info" as const,
    },
    success: {
      icon: "check_circle",
      iconBg: "bg-green-500",
      badge: "success" as const,
    },
  };

  const config = typeConfig[notification.type];

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      aria-label={`${notification.type}: ${notification.title}`}
      className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        notification.read
          ? "bg-transparent hover:bg-[var(--sidebar)]"
          : "bg-[var(--sidebar)] hover:bg-[var(--sidebar-accent)]"
      }`}
    >
      <div
        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconBg}`}
      >
        <span className="material-symbols-sharp text-white text-sm lg:text-base">
          {config.icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-primary text-sm font-medium ${
                notification.read
                  ? "text-[var(--muted-foreground)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {notification.title}
            </span>
            <Badge variant={config.badge} className="text-[10px]">
              {notification.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
            )}
            <span className="material-symbols-sharp text-[var(--muted-foreground)] text-base">
              chevron_right
            </span>
          </div>
        </div>

        <p
          className={`text-xs lg:text-sm mt-1 line-clamp-1 ${
            notification.read
              ? "text-[var(--muted-foreground)]"
              : "text-[var(--foreground)]"
          }`}
        >
          {notification.message}
        </p>

        <div className="flex items-center gap-2 mt-2 text-[10px] lg:text-xs text-[var(--muted-foreground)]">
          <span>{notification.source}</span>
          <span>•</span>
          <span>{formatTime(notification.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function NotificationDetailModal({
  notification,
  onClose,
  onDelete,
}: {
  notification: Notification;
  onClose: () => void;
  onDelete: () => void;
}) {
  const typeConfig = {
    error: {
      icon: "error",
      iconBg: "bg-red-500",
      badge: "error" as const,
      color: "text-red-500",
    },
    warning: {
      icon: "warning",
      iconBg: "bg-yellow-500",
      badge: "warning" as const,
      color: "text-yellow-500",
    },
    info: {
      icon: "info",
      iconBg: "bg-blue-500",
      badge: "info" as const,
      color: "text-blue-500",
    },
    success: {
      icon: "check_circle",
      iconBg: "bg-green-500",
      badge: "success" as const,
      color: "text-green-500",
    },
  };

  const config = typeConfig[notification.type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Bottom sheet on mobile, centered on desktop */}
      <div
        className="fixed inset-x-0 bottom-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 lg:w-[500px] lg:max-w-[90vw]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
      >
        <div className="bg-[var(--card)] rounded-t-2xl lg:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}
              >
                <span className="material-symbols-sharp text-white">{config.icon}</span>
              </div>
              <div>
                <h2
                  id="notification-title"
                  className="font-primary text-base font-semibold text-[var(--foreground)]"
                >
                  {notification.title}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={config.badge} className="text-[10px]">
                    {notification.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {notification.source}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--sidebar)] transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-sharp text-[var(--muted-foreground)]">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Timestamp */}
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <span className="material-symbols-sharp text-sm">schedule</span>
              <span>{notification.timestamp.toLocaleString()}</span>
            </div>

            {/* Message */}
            <div>
              <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Message
              </h3>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Details */}
            {notification.details && (
              <div>
                <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Details
                </h3>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {notification.details}
                </p>
              </div>
            )}

            {/* Stack Trace */}
            {notification.stackTrace && (
              <div>
                <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Stack Trace
                </h3>
                <pre className="text-xs text-[var(--muted-foreground)] bg-[var(--sidebar)] p-3 rounded-lg overflow-x-auto font-mono">
                  {notification.stackTrace}
                </pre>
              </div>
            )}

            {/* Metadata */}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Metadata
                </h3>
                <div className="bg-[var(--sidebar)] rounded-lg p-3 space-y-2">
                  {Object.entries(notification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-[var(--muted-foreground)]">{key}</span>
                      <span className="text-[var(--foreground)] font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-4 border-t border-[var(--border)]">
            <button
              onClick={onDelete}
              className="flex-1 px-4 py-2.5 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getDefaultNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: "1",
      type: "info",
      title: "System Started",
      message: "FUGUE Orchestrator initialized successfully",
      timestamp: new Date(now.getTime() - 300000),
      source: "Orchestrator",
      read: false,
      details: "All subsystems are operational. Connected to 4 execution tier agents.",
      metadata: {
        "Version": "1.0.0",
        "Environment": "Production",
        "Region": "ap-northeast-1",
      },
    },
    {
      id: "2",
      type: "success",
      title: "Agent Connected",
      message: "Codex agent is now online and ready",
      timestamp: new Date(now.getTime() - 600000),
      source: "Agent Manager",
      read: false,
      details: "Codex agent successfully authenticated and registered with the orchestrator.",
      metadata: {
        "Agent ID": "codex-001",
        "Capabilities": "design, security, analysis",
        "Status": "READY",
      },
    },
    {
      id: "3",
      type: "warning",
      title: "High Latency Detected",
      message: "Response time exceeded 2s for GLM-4.7 agent",
      timestamp: new Date(now.getTime() - 1800000),
      source: "Performance Monitor",
      read: true,
      details: "The GLM-4.7 agent is experiencing higher than normal response times. This may be due to high load or network issues.",
      metadata: {
        "Average Latency": "2.4s",
        "Threshold": "2.0s",
        "Samples": "15",
      },
    },
    {
      id: "4",
      type: "error",
      title: "WebSocket Disconnected",
      message: "Connection to Cloudflare Worker lost. Reconnecting...",
      timestamp: new Date(now.getTime() - 3600000),
      source: "WebSocket Manager",
      read: true,
      details: "The WebSocket connection was unexpectedly closed. The system will attempt to reconnect automatically.",
      stackTrace: `Error: WebSocket connection closed
  at WebSocketManager.handleClose (websocket.ts:145)
  at WebSocket.onclose (websocket.ts:89)
  at callEventTarget (native)`,
      metadata: {
        "Close Code": "1006",
        "Reason": "Abnormal closure",
        "Reconnect Attempts": "3",
      },
    },
  ];
}
