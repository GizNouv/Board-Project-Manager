import { z } from 'zod';

// ============================================================
// DTOs
// ============================================================

export interface ColumnDTO {
  id: string;
  title: string;
  boardId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Schemas
// ============================================================

export const createColumnSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  title: z.string().min(1, 'Title is required').max(50).trim(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
  title: z.string().min(1, 'Title is required').max(50).trim(),
});

export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

export const deleteColumnSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
});

export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;