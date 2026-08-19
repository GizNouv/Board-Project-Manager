'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { ROUTES } from '@/config/routes';

export type ActionResult<T> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        message: string;
    };

export interface ColumnDTO {
    id: string;
    boardId: string;
    title: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

const createColumnSchema = z.object({
    boardId: z.string().min(1, 'Board ID is required'),
    title: z.string()
        .min(1, 'Column name is required')
        .max(50, 'Column name must not exceed 50 characters')
        .trim(),
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;

/**
 * Server Action for creating a new column
 * Validates input, calls application service, and returns plain JSON
 */
export async function createColumnAction(input: CreateColumnInput): Promise<ActionResult<ColumnDTO>> {
    try {
        // Validate input
        const validationResult = createColumnSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { boardId, title } = validationResult.data;

        // Instantiate repositories and service
        const boardRepository = new PrismaBoardRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardService = new BoardApplicationService(boardRepository, columnRepository);

        // Create column using application service
        const result = await boardService.addColumn({
            boardId,
            title,
        });

        if (!result.isSuccess()) {
            return {
                success: false,
                message: result.error.message,
            };
        }

        // Convert Domain Entity to plain object
        const column = result.value;
        const columnDTO: ColumnDTO = {
            id: column.id.toString(),
            boardId: column.boardId,
            title: column.title,
            order: column.order,
            createdAt: column.createdAt.toISOString(),
            updatedAt: column.updatedAt.toISOString(),
        };

        // Revalidate the board page
        revalidatePath(`/boards/${boardId}`);

        return {
            success: true,
            data: columnDTO,
        };
    } catch (error) {
        console.error('Create column action error:', error);
        return {
            success: false,
            message: 'An unexpected error occurred while creating the column',
        };
    }
}

// ============== DELETE COLUMN SCHEMA ==============

const deleteColumnSchema = z.object({
    columnId: z.string().min(1, 'Column ID is required'),
    boardId: z.string().min(1, 'Board ID is required'),
});

export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;

// ============== DELETE COLUMN ACTION ==============

export async function deleteColumnAction(input: DeleteColumnInput): Promise<ActionResult<void>> {
    console.log('🔵 deleteColumnAction called');
    console.log('  input:', input);

    try {
        const validationResult = deleteColumnSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { columnId, boardId } = validationResult.data;

        const boardRepository = new PrismaBoardRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardService = new BoardApplicationService(boardRepository, columnRepository);

        const result = await boardService.deleteColumn(columnId);

        if (!result.isSuccess()) {
            return {
                success: false,
                message: result.error.message,
            };
        }

        revalidatePath(`/boards/${boardId}`);

        return {
            success: true,
            data: undefined,
        };
    } catch (error) {
        console.error('❌ deleteColumnAction error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred while deleting the column',
        };
    }
}