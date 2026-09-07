import type { TaskFields } from '@/types/shared/task';

// ============================================================
// DTOs
// ============================================================

export interface CreateTaskDTO extends TaskFields {}

export interface UpdateTaskDTO extends Partial<TaskFields> {}

export interface MoveTaskDTO {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
}

export interface ReorderTaskDTO {
  taskId: string;
  columnId: string;
  position: number;
}

export interface TaskResponseDTO {
  id: string;
  title: string;
  description: string;
  estimate: number;
  estimateUnit: string;
  priority: string;
  type: string;
  assigneeId: string | null;
  columnId: string;
  createdAt: Date;
  updatedAt: Date;
}