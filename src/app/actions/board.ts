'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { ROUTES } from '@/config/routes';
import { BoardId, ColumnId, ResultFactory, ValidationException } from '@/core/domain';
import { ColumnDTO } from '@/core/application/dto/BoardDTOs';

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

// ============== UPDATE COLUMN SCHEMA ==============

const updateColumnSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
  title: z.string()
    .min(1, 'Column title is required')
    .max(100, 'Column title must not exceed 100 characters')
    .trim(),
});

export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

// ============== UPDATE BOARD SCHEMA ==============

const updateBoardSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  title: z.string()
    .min(1, 'Board title is required')
    .max(100, 'Board title must not exceed 100 characters')
    .trim(),
});

export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

// ============== CREATE BOARD ==============

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

// ============== REORDER COLUMNS ==============

export async function reorderColumnsAction(input: ReorderColumnsInput): Promise<ActionResult<void>> {
  console.log('🔵 reorderColumnsAction called');
  console.log('  input:', input);

  try {
    const validationResult = reorderColumnsSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { boardId, columnId, newOrder } = validationResult.data;

    const boardRepository = new PrismaBoardRepository();
    const columnRepository = new PrismaColumnRepository();
    const boardService = new BoardApplicationService(boardRepository, columnRepository);

    const boardResult = await boardService.getBoardWithColumns(boardId);
    if (!boardResult.isSuccess()) {
      return {
        success: false,
        message: boardResult.error.message,
      };
    }

    const board = boardResult.value;
    board.reorderColumn(new ColumnId(columnId), newOrder);

    const saveResult = await boardRepository.saveBoardWithColumns(board);
    if (!saveResult.isSuccess()) {
      return {
        success: false,
        message: saveResult.error.message,
      };
    }

    revalidatePath(`/boards/${boardId}`);

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error('Reorder columns action error:', error);
    if (error instanceof ValidationException) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: 'An unexpected error occurred while reordering columns',
    };
  }
}

// ============== UPDATE COLUMN ==============

export async function updateColumnAction(input: UpdateColumnInput): Promise<ActionResult<ColumnDTO>> {
  console.log('🔵 updateColumnAction called');
  console.log('  input:', input);

  try {
    const validationResult = updateColumnSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { columnId, boardId, title } = validationResult.data;

    const boardRepository = new PrismaBoardRepository();
    const columnRepository = new PrismaColumnRepository();
    const boardService = new BoardApplicationService(boardRepository, columnRepository);

    // Update the column using the application service
    const result = await boardService.updateColumn(columnId, { title });

    if (!result.isSuccess()) {
      return {
        success: false,
        message: result.error.message,
      };
    }

    const column = result.value;
    const columnDTO: ColumnDTO = {
      id: column.id.toString(),
      boardId: column.boardId,
      title: column.title,
      order: column.order,
      createdAt: column.createdAt.toISOString(),
      updatedAt: column.updatedAt.toISOString(),
    };

    revalidatePath(`/boards/${boardId}`);

    return {
      success: true,
      data: columnDTO,
    };
  } catch (error) {
    console.error('❌ updateColumnAction error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred while updating the column',
    };
  }
}

// ============== UPDATE BOARD ==============

export async function updateBoardAction(input: UpdateBoardInput): Promise<ActionResult<BoardDTO>> {
  console.log('🔵 updateBoardAction called');
  console.log('  input:', input);

  try {
    const validationResult = updateBoardSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        message: firstError.message,
      };
    }

    const { boardId, title } = validationResult.data;

    const boardRepository = new PrismaBoardRepository();
    const columnRepository = new PrismaColumnRepository();
    const boardService = new BoardApplicationService(boardRepository, columnRepository);

    const result = await boardService.updateBoard(boardId, { title });

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

    revalidatePath(`/boards/${boardId}`);

    return {
      success: true,
      data: boardDTO,
    };
  } catch (error) {
    console.error('❌ updateBoardAction error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred while updating the board',
    };
  }
}