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
import {
    type TaskType,
    type Priority,
    type EstimateUnit,
    type Severity,
    type Complexity,
    type EstimateValue,
    TaskTypesEnum,
    TaskPrioritiesEnum,
    TaskEstimateUnitEnum,
    TaskSeverityEnum,
    TaskComplexityEnum
} from '@/types';

export const TASK_DEFAULTS = {
    type: TaskTypesEnum.FEATURE as TaskType,
    priority: TaskPrioritiesEnum.MEDIUM as Priority,
    estimateUnit: TaskEstimateUnitEnum.HOURS as EstimateUnit,
    severity: TaskSeverityEnum.MAJOR as Severity,
    complexity: TaskComplexityEnum.MEDIUM as Complexity,
    estimate: 1 as EstimateValue,
    order: 0 as const,
} as const;