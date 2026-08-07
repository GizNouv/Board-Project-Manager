'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { ROUTES } from '@/config/routes';
import { BoardId, ColumnId, ResultFactory, ValidationException } from '@/core/domain';

export type ActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export interface BoardDTO {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

const createBoardSchema = z.object({
  title: z.string()
    .min(1, 'Board name is required')
    .max(100, 'Board name must not exceed 100 characters')
    .trim(),
  ownerId: z.string().min(1, 'Owner ID is required'),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;

const reorderColumnsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  columnId: z.string().min(1, 'Column ID is required'),
  newOrder: z.number().min(0, 'Order must be a positive number'),
});

export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;

export async function createBoardAction(input: CreateBoardInput): Promise<ActionResult<BoardDTO>> {
  try {
    const validationResult = createBoardSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { title, ownerId } = validationResult.data;

    const boardRepository = new PrismaBoardRepository();
    const columnRepository = new PrismaColumnRepository();
    const boardService = new BoardApplicationService(boardRepository, columnRepository);

    const result = await boardService.createBoard({
      title,
      ownerId,
    });

    if (!result.isSuccess()) {
      return {
        success: false,
        message: result.error.message,
      };
    }

    const board = result.value;
    const boardDTO: BoardDTO = {
      id: board.id.toString(),
      title: board.title,
      ownerId: board.ownerId.toString(),
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
    };

    revalidatePath(ROUTES.boards);

    return {
      success: true,
      data: boardDTO,
    };
  } catch (error) {
    console.error('Create board action error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while creating the board',
    };
  }
}

export async function reorderColumnsAction(input: ReorderColumnsInput): Promise<ActionResult<void>> {
  console.log('🔵 reorderColumnsAction called');
  console.log('  input:', input);

  try {
    const validationResult = reorderColumnsSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      console.log('  ❌ Validation failed:', firstError.message);
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { boardId, columnId, newOrder } = validationResult.data;

    console.log('  ✅ Validation passed');
    console.log('  boardId:', boardId);
    console.log('  columnId:', columnId);
    console.log('  newOrder:', newOrder);

    const boardRepository = new PrismaBoardRepository();
    console.log('  📦 BoardRepository created');

    const boardResult = await boardRepository.findBoardWithColumns(new BoardId(boardId));
    console.log('  📦 Board loaded:', boardResult.isSuccess());

    if (!boardResult.isSuccess()) {
      console.log('  ❌ Board not found');
      return {
        success: false,
        message: boardResult.error.message,
      };
    }

    const board = boardResult.value;
    console.log('  📊 Board before reorder:');
    console.log('    columns:', board.columns.map(c => ({ id: c.id.toString(), title: c.title, order: c.order })));

    // Use the aggregate root method to reorder columns
    board.reorderColumn(new ColumnId(columnId), newOrder);

    console.log('  📊 Board after reorder:');
    console.log('    columns:', board.columns.map(c => ({ id: c.id.toString(), title: c.title, order: c.order })));

    // Save the entire board aggregate
    console.log('  💾 Saving board...');
    const saveResult = await boardRepository.saveBoardWithColumns(board);
    console.log('  💾 Save result:', saveResult.isSuccess());

    if (!saveResult.isSuccess()) {
      console.log('  ❌ Save failed:', saveResult.error.message);
      return {
        success: false,
        message: saveResult.error.message,
      };
    }

    console.log('  ✅ Board saved successfully');

    revalidatePath(`/boards/${boardId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    // Log the FULL error details
    console.error('❌ reorderColumnsAction ERROR DETAILS:');
    console.error('  error:', error);
    console.error('  error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('  error stack:', error instanceof Error ? error.stack : 'No stack');
    
    if (error instanceof ValidationException) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: `An unexpected error occurred while reordering columns: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}