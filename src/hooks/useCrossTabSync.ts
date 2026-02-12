"use client";

import { useEffect, useCallback, useRef } from "react";

type CrossTabChannel = "auth" | "theme" | "sync";

interface CrossTabMessage {
  readonly channel: CrossTabChannel;
  readonly action: string;
  readonly payload?: unknown;
  readonly timestamp: number;
}

/**
 * Cross-tab synchronization via BroadcastChannel.
 *
 * Channels:
 * - auth: logout sync across tabs
 * - theme: theme change sync
 * - sync: conflict resolution sync
 */
export function useCrossTabSync(
  channel: CrossTabChannel,
  onMessage: (action: string, payload?: unknown) => void,
) {
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const bc = new BroadcastChannel("fugue-cross-tab");
    bcRef.current = bc;

    const handler = (event: MessageEvent<CrossTabMessage>) => {
      if (event.data.channel === channel) {
        onMessage(event.data.action, event.data.payload);
      }
    };

    bc.addEventListener("message", handler);

    return () => {
      bc.removeEventListener("message", handler);
      bc.close();
      bcRef.current = null;
    };
  }, [channel, onMessage]);

  const broadcast = useCallback(
    (action: string, payload?: unknown) => {
      bcRef.current?.postMessage({
        channel,
        action,
        payload,
        timestamp: Date.now(),
      } satisfies CrossTabMessage);
    },
    [channel],
  );

  return { broadcast };
}
