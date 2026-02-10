"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useWebSocket, type WebSocketMessage } from "./useWebSocket";
import type {
  ServerTask,
  ServerGitRepo,
  ServerAlert,
  ServerProviderHealth,
} from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "";

interface ServerDataState {
  readonly tasks: readonly ServerTask[];
  readonly gitRepos: readonly ServerGitRepo[];
  readonly alerts: readonly ServerAlert[];
  readonly providerHealth: readonly ServerProviderHealth[];
  readonly isLive: boolean;
}

const INITIAL_STATE: ServerDataState = {
  tasks: [],
  gitRepos: [],
  alerts: [],
  providerHealth: [],
  isLive: false,
};

export function useServerData() {
  const [state, setState] = useState<ServerDataState>(INITIAL_STATE);

  const handleMessage = useCallback((msg: WebSocketMessage) => {
    switch (msg.type) {
      case "tasks": {
        const payload = msg.payload as ServerTask[];
        if (Array.isArray(payload)) {
          setState((prev) => ({
            ...prev,
            tasks: payload,
            isLive: true,
          }));
        }
        break;
      }

      case "git-status": {
        const payload = msg.payload as { repos: ServerGitRepo[] };
        if (payload?.repos && Array.isArray(payload.repos)) {
          setState((prev) => ({
            ...prev,
            gitRepos: payload.repos,
          }));
        }
        break;
      }

      case "alert": {
        const payload = msg.payload as ServerAlert;
        if (payload?.id) {
          setState((prev) => ({
            ...prev,
            alerts: [
              ...prev.alerts.filter((a) => a.id !== payload.id),
              payload,
            ],
          }));
        }
        break;
      }

      case "observability-sync": {
        const payload = msg.payload as {
          provider_health?: ServerProviderHealth[];
        };
        if (payload?.provider_health) {
          setState((prev) => ({
            ...prev,
            providerHealth: payload.provider_health ?? [],
          }));
        }
        break;
      }

      case "task-result": {
        const payload = msg.payload as ServerTask;
        if (payload?.id) {
          setState((prev) => ({
            ...prev,
            tasks: [
              ...prev.tasks.filter((t) => t.id !== payload.id),
              payload,
            ],
            isLive: true,
          }));
        }
        break;
      }

      default:
        break;
    }
  }, []);

  const { isConnected, isConnecting, error, send } = useWebSocket({
    url: WS_URL,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    onMessage: handleMessage,
  });

  const refresh = useCallback(() => {
    send({ type: "status-request" });
  }, [send]);

  // Auto-refresh on reconnect
  const prevConnected = useRef(false);
  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      const timer = setTimeout(refresh, 500);
      prevConnected.current = true;
      return () => clearTimeout(timer);
    }
    if (!isConnected) {
      prevConnected.current = false;
    }
  }, [isConnected, refresh]);

  return {
    ...state,
    isConnected,
    isConnecting,
    error,
    refresh,
  } as const;
}
