"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCrossTabSync } from "@/hooks/useCrossTabSync";
import { type SyncConflict, type SyncConflictResolution, type SyncEntity, type SyncEntityType, type SyncState } from "@/types/sync";
import { ServerSyncConflictSchema, ServerSyncPushSchema, ServerSyncStateSchema } from "@/types/ws-events";
import type { WebSocketMessage } from "@/hooks/useWebSocket";
type SyncTable = "fugue_tasks" | "fugue_agents" | "fugue_execution_plans";
type RealtimePayload = { eventType: "INSERT" | "UPDATE" | "DELETE"; new: unknown; old: unknown };
const TABLE_TO_TYPE: Record<SyncTable, SyncEntityType> = { fugue_tasks: "task", fugue_agents: "agent", fugue_execution_plans: "execution_plan" };
const TYPE_TO_TABLE: Record<SyncEntityType, SyncTable> = { task: "fugue_tasks", agent: "fugue_agents", execution_plan: "fugue_execution_plans" };
const INITIAL_SYNC_STATE: SyncState = { status: "synced", pendingChanges: 0, conflictCount: 0 };
export interface UseBidirectionalSyncReturn { syncState: SyncState; conflicts: SyncConflict[]; handleSyncMessage: (msg: WebSocketMessage) => void; resolveConflict: (conflictId: string, resolution: SyncConflictResolution) => void; forcePush: () => Promise<void> }
interface UseBidirectionalSyncOptions { onMessage: (msg: WebSocketMessage) => void }
const toMillis = (value: string | number | undefined): number => {
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n < 1e12 ? n * 1000 : n;
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
};
const toEntity = (table: SyncTable, row: Record<string, unknown>): SyncEntity | null => {
  const rawId = row.id;
  if (typeof rawId !== "string" && typeof rawId !== "number") return null;
  const updatedBy = row.updated_by ?? row.updatedBy;
  return {
    id: String(rawId),
    type: TABLE_TO_TYPE[table],
    data: { ...row },
    updatedAt: (row.updated_at ?? row.updatedAt ?? Date.now()) as string | number,
    updatedBy: typeof updatedBy === "string" ? updatedBy : undefined,
    version: typeof row.version === "number" ? row.version : 0,
  };
};
export function useBidirectionalSync(options: UseBidirectionalSyncOptions): UseBidirectionalSyncReturn {
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_SYNC_STATE);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const onMessageRef = useRef(options.onMessage);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const entitiesRef = useRef(new Map<string, SyncEntity>());
  const pendingRef = useRef(new Map<string, SyncEntity>());
  const conflictsRef = useRef<SyncConflict[]>([]);
  useEffect(() => { onMessageRef.current = options.onMessage; }, [options.onMessage]);
  const notifyUser = useCallback((message: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("fugue-sync-notification", { detail: { message } }));
    if (window.Notification && Notification.permission === "granted") new Notification("FUGUE Sync", { body: message });
  }, []);
  const updateSyncState = useCallback((status?: SyncState["status"]) => {
    const conflictCount = conflictsRef.current.length;
    setSyncState((prev) => ({
      ...prev,
      status: status ?? (conflictCount > 0 ? "conflict" : "synced"),
      pendingChanges: pendingRef.current.size,
      conflictCount,
      lastSyncedAt: Date.now(),
    }));
  }, []);
  const updateSyncStateWithCount = useCallback((conflictCount: number, status?: SyncState["status"]) => {
    setSyncState((prev) => ({
      ...prev,
      status: status ?? (conflictCount > 0 ? "conflict" : "synced"),
      pendingChanges: pendingRef.current.size,
      conflictCount,
      lastSyncedAt: Date.now(),
    }));
  }, []);
  const applyEntityLww = useCallback((incoming: SyncEntity) => {
    const key = `${incoming.type}:${incoming.id}`;
    const current = entitiesRef.current.get(key);
    if (!current || toMillis(incoming.updatedAt) >= toMillis(current.updatedAt)) {
      entitiesRef.current.set(key, incoming);
      pendingRef.current.delete(key);
      return;
    }
    notifyUser(`LWW kept local ${incoming.type} ${incoming.id}.`);
  }, [notifyUser]);
  const applyResolution = useCallback((conflict: SyncConflict, resolution: SyncConflictResolution) => {
    const key = `${conflict.entityType}:${conflict.entityId}`;
    if (resolution === "remote") {
      entitiesRef.current.set(key, conflict.remoteVersion);
      pendingRef.current.delete(key);
      return;
    }
    entitiesRef.current.set(key, conflict.localVersion);
    pendingRef.current.set(key, conflict.localVersion);
  }, []);
  const resolveConflictBase = useCallback((conflictId: string, resolution: SyncConflictResolution) => {
    setConflicts((prev) => {
      const conflict = prev.find((item) => item.id === conflictId);
      if (!conflict) return prev;
      applyResolution(conflict, resolution);
      const next = prev.filter((item) => item.id !== conflictId);
      conflictsRef.current = next;
      updateSyncStateWithCount(next.length);
      return next;
    });
  }, [applyResolution, updateSyncStateWithCount]);
  const { broadcast } = useCrossTabSync("sync", useCallback((action: string, payload?: unknown) => {
    if (action !== "resolve-conflict" || !payload || typeof payload !== "object") return;
    const data = payload as { conflictId?: string; resolution?: SyncConflictResolution };
    if (typeof data.conflictId === "string" && data.resolution) resolveConflictBase(data.conflictId, data.resolution);
  }, [resolveConflictBase]));
  const resolveConflict = useCallback((conflictId: string, resolution: SyncConflictResolution) => {
    resolveConflictBase(conflictId, resolution);
    broadcast("resolve-conflict", { conflictId, resolution });
  }, [broadcast, resolveConflictBase]);
  const handleSyncMessage = useCallback((msg: WebSocketMessage) => {
    const stateMsg = ServerSyncStateSchema.safeParse(msg);
    if (stateMsg.success) {
      setSyncState((prev) => ({ ...prev, ...stateMsg.data.payload, pendingChanges: pendingRef.current.size, conflictCount: conflictsRef.current.length, status: conflictsRef.current.length > 0 ? "conflict" : stateMsg.data.payload.status }));
      return;
    }
    const pushMsg = ServerSyncPushSchema.safeParse(msg);
    if (pushMsg.success) {
      pushMsg.data.payload.entities.forEach((entity) => applyEntityLww(entity));
      updateSyncState();
      return;
    }
    const conflictMsg = ServerSyncConflictSchema.safeParse(msg);
    if (conflictMsg.success) {
      const incoming = conflictMsg.data.payload;
      const localTs = toMillis(incoming.localVersion.updatedAt);
      const remoteTs = toMillis(incoming.remoteVersion.updatedAt);
      if (localTs !== remoteTs) {
        const winner: SyncConflictResolution = localTs > remoteTs ? "local" : "remote";
        applyResolution(incoming, winner);
        notifyUser(`Conflict auto-resolved via LWW (${winner}).`);
        updateSyncState();
        return;
      }
      setConflicts((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev;
        const next = [...prev, incoming];
        conflictsRef.current = next;
        updateSyncStateWithCount(next.length, "conflict");
        return next;
      });
      notifyUser(`Manual sync conflict on ${incoming.entityType} ${incoming.entityId}.`);
      return;
    }
    onMessageRef.current(msg);
  }, [applyEntityLww, applyResolution, notifyUser, updateSyncState, updateSyncStateWithCount]);
  useEffect(() => {
    if (typeof window === "undefined" || !supabase) return;
    const onRealtime = (table: SyncTable, payload: RealtimePayload) => {
      const row = payload.eventType === "DELETE" ? payload.old : payload.new;
      if (!row || typeof row !== "object") return;
      const entity = toEntity(table, row as Record<string, unknown>);
      if (!entity) return;
      const key = `${entity.type}:${entity.id}`;
      if (payload.eventType === "DELETE") {
        entitiesRef.current.delete(key);
        pendingRef.current.delete(key);
      } else {
        applyEntityLww(entity);
      }
      updateSyncState();
    };
    const channel = supabase!
      .channel("fugue-bidirectional-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "fugue_tasks" }, (p) => onRealtime("fugue_tasks", p as RealtimePayload))
      .on("postgres_changes", { event: "*", schema: "public", table: "fugue_agents" }, (p) => onRealtime("fugue_agents", p as RealtimePayload))
      .on("postgres_changes", { event: "*", schema: "public", table: "fugue_execution_plans" }, (p) => onRealtime("fugue_execution_plans", p as RealtimePayload))
      .subscribe((status) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSyncState((prev) => ({ ...prev, status: "offline" })); });
    channelRef.current = channel;
    return () => {
      if (!channelRef.current) return;
      void supabase!.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [applyEntityLww, updateSyncState]);
  const forcePush = useCallback(async () => {
    if (!supabase) return;
    const pending = Array.from(pendingRef.current.values());
    if (pending.length === 0) return;
    setSyncState((prev) => ({ ...prev, status: "syncing", pendingChanges: pending.length }));
    const grouped: Record<SyncTable, SyncEntity[]> = { fugue_tasks: [], fugue_agents: [], fugue_execution_plans: [] };
    pending.forEach((entity) => { grouped[TYPE_TO_TABLE[entity.type]] = [...grouped[TYPE_TO_TABLE[entity.type]], entity]; });
    try {
      const tables = Object.keys(grouped) as SyncTable[];
      for (const table of tables) {
        if (grouped[table].length === 0) continue;
        const rows = grouped[table].map((entity) => ({ ...entity.data, id: entity.id, updated_at: entity.updatedAt, updated_by: entity.updatedBy, version: entity.version }));
        const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }
      pendingRef.current.clear();
      updateSyncState();
    } catch {
      setSyncState((prev) => ({ ...prev, status: "offline", pendingChanges: pendingRef.current.size }));
      notifyUser("Force push failed. Pending changes retained.");
    }
  }, [notifyUser, updateSyncState]);
  return { syncState, conflicts, handleSyncMessage, resolveConflict, forcePush };
}
