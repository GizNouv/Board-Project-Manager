import type { TaskFields, TaskId } from '@/types/shared/task';

export interface TaskData extends TaskFields {
  id: TaskId;
}

export interface ColumnData {
  id: string;
  title: string;
  boardId: string;
  order: number;
  tasks: TaskData[];
}

export interface BoardData {
  id: string;
  title: string;
  columns: ColumnData[];
  createdAt?: string;
  updatedAt?: string;
}