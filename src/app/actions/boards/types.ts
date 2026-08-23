import { z } from 'zod';

// ============================================================
// DTOs
// ============================================================

export interface BoardDTO {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Schemas
// ============================================================

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).trim(),
  ownerId: z.string().min(1, 'Owner ID is required'),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  title: z.string().min(1, 'Title is required').max(100).trim(),
});

export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

export const deleteBoardSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
});

export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;

export const reorderColumnsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
  newOrder: z.number().min(0, 'Order must be positive'),
});

export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;