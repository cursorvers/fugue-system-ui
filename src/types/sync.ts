import { z } from "zod";

// =============================================================================
// Sync Entity Types
// =============================================================================

export const SyncEntityTypeSchema = z.enum([
  "task",
  "agent",
  "execution_plan",
]);
export type SyncEntityType = z.infer<typeof SyncEntityTypeSchema>;

export const SyncEntitySchema = z.object({
  id: z.string(),
  type: SyncEntityTypeSchema,
  data: z.record(z.string(), z.unknown()),
  updatedAt: z.union([z.string(), z.number()]),
  updatedBy: z.string().optional(),
  version: z.number().int().min(0),
});
export type SyncEntity = z.infer<typeof SyncEntitySchema>;

// =============================================================================
// Sync State
// =============================================================================

export const SyncStatusSchema = z.enum([
  "synced",
  "syncing",
  "conflict",
  "offline",
]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export const SyncStateSchema = z.object({
  status: SyncStatusSchema,
  lastSyncedAt: z.union([z.string(), z.number()]).optional(),
  pendingChanges: z.number().int().min(0).default(0),
  conflictCount: z.number().int().min(0).default(0),
});
export type SyncState = z.infer<typeof SyncStateSchema>;

// =============================================================================
// Sync Conflicts
// =============================================================================

export const SyncConflictResolutionSchema = z.enum([
  "local",
  "remote",
  "manual",
]);
export type SyncConflictResolution = z.infer<typeof SyncConflictResolutionSchema>;

export const SyncConflictSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  entityType: SyncEntityTypeSchema,
  localVersion: SyncEntitySchema,
  remoteVersion: SyncEntitySchema,
  detectedAt: z.union([z.string(), z.number()]),
  resolution: SyncConflictResolutionSchema.optional(),
});
export type SyncConflict = z.infer<typeof SyncConflictSchema>;
