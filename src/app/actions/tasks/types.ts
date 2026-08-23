import { z } from 'zod';

// ============================================================
// DTOs
// ============================================================

export interface TaskDTO {
  id: string;
  title: string;
  description: string;
  priority: string;
  estimate: number;
  estimateUnit: string;
  type: string;
  assigneeId: string | null;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Schemas
// ============================================================

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().optional().default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  estimate: z.number().min(0, 'Estimate must be positive'),
  estimateUnit: z.enum(['hours', 'days']),
  columnId: z.string().min(1, 'Column ID is required'),
  type: z.enum(['FEATURE', 'BUG', 'EPIC']).default('FEATURE'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  estimate: z.object({
    value: z.number().min(0),
    unit: z.enum(['hours', 'days']).optional(),
  }).optional(),
  severity: z.enum(['minor', 'major', 'critical']).optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
  assigneeId: z.string().nullable().optional(),
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