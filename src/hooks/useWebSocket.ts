"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: string;
  payload?: unknown;
  taskId?: string;
  message?: string;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  send: (message: WebSocketMessage) => void;
  sendChat: (content: string, context?: Record<string, unknown>) => void;
  sendCommand: (command: string, args?: string[]) => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Request initial status
        ws.send(JSON.stringify({ type: "status-request" }));

        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          onMessage?.(message);
        } catch (e) {
          console.error("[useWebSocket] Failed to parse message:", e);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);

        // Don't reconnect on auth errors (401, 403) or if max attempts reached
        const authErrorCodes = [1008, 1003]; // Policy violation, unsupported data
        const shouldReconnect =
          !event.wasClean &&
          !authErrorCodes.includes(event.code) &&
          reconnectAttemptsRef.current < maxReconnectAttempts;

        if (shouldReconnect) {
          reconnectAttemptsRef.current++;
          console.log(
            `[useWebSocket] Reconnecting (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Connection failed. Server may require authentication.");
        }

        onClose?.();
      };

      ws.onerror = (event) => {
        setError("WebSocket connection error");
        setIsConnecting(false);
        onError?.(event);
      };

      wsRef.current = ws;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
      setIsConnecting(false);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[useWebSocket] Cannot send, WebSocket not connected");
    }
  }, []);

  const sendChat = useCallback(
    (content: string, context?: Record<string, unknown>) => {
      send({
        type: "chat",
        payload: {
          message: content,
          context,
        },
      });
    },
    [send]
  );

  const sendCommand = useCallback(
    (command: string, args?: string[]) => {
      send({
        type: "command",
        payload: {
          command,
          args,
        },
      });
    },
    [send]
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    send,
    sendChat,
    sendCommand,
  };
}
