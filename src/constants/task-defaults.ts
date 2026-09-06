// src/lib/constants/task-defaults.ts

/**
 * Single source of truth for task default values across all layers.
 * Used by: Domain, Application, Frontend, and Zod schemas.
 * 
 * IMPORTANT:
 * - Create: Apply defaults when field is undefined
 * - Update: Only apply default if reclassifying task (FEATURE → BUG needs severity)
 * - Prisma: @default in schema is a database safety net, not the source of truth
 */
export const TASK_DEFAULTS = {
    // Type classification
    type: 'FEATURE' as const,
    severity: 'major' as const,        // For BUG tasks
    complexity: 'medium' as const,     // For FEATURE tasks

    // Effort estimation
    estimate: 1 as const,
    estimateUnit: 'hours' as const,

    // Priority
    priority: 'MEDIUM' as const,

    // Ordering (Prisma only, not exposed to app)
    order: 0 as const,
} as const;

// Type helpers for TypeScript
export type TaskType = typeof TASK_DEFAULTS.type;
export type Severity = 'minor' | 'major' | 'critical';
export type Complexity = 'low' | 'medium' | 'high';
export type EstimateUnit = 'hours' | 'days';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';