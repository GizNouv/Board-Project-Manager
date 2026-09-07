import { z } from 'zod';
import { TASK_TYPES, PRIORITIES, ESTIMATE_UNITS, SEVERITIES, COMPLEXITIES, type TaskType, type Priority, type EstimateUnit, type Severity, type Complexity, TaskTitle, TaskDescription, EstimateValue, TaskDTOFields } from '@/types/shared/task';
import { TASK_DEFAULTS } from '@/constants/task-defaults';

// ============================================================
// DTOs
// ============================================================

export interface TaskDTO extends TaskDTOFields {}

// ============================================================
// Schemas
// ============================================================

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().optional().default(''),
  priority: z.enum(PRIORITIES),
  estimate: z.number().min(0, 'Estimate must be positive'),
  estimateUnit: z.enum(ESTIMATE_UNITS),
  columnId: z.string().min(1, 'Column ID is required'),
  type: z.enum(TASK_TYPES).default(TASK_DEFAULTS.type),
  severity: z.enum(SEVERITIES).optional(),
  complexity: z.enum(COMPLEXITIES).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  estimate: z.object({
    value: z.number().min(0),
    unit: z.enum(ESTIMATE_UNITS).optional(),
  }).optional(),
  severity: z.enum(SEVERITIES).optional(),
  complexity: z.enum(COMPLEXITIES).optional(),
  assigneeId: z.string().nullable().optional(),
  type: z.enum(TASK_TYPES).optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
});

export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

export const moveTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  sourceColumnId: z.string().min(1, 'Source column ID is required'),
  targetColumnId: z.string().min(1, 'Target column ID is required'),
  targetOrder: z.number().min(0, 'Target order must be positive'),
  sourceTaskIds: z.array(z.string()),
  targetTaskIds: z.array(z.string()).min(1, 'Target task IDs are required'),
});

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export const reorderTasksSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  orderedTaskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
});

export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;