'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { ROUTES } from '@/config/routes';

// Serializable ActionResult type for Server Actions
export type ActionResult<T> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        message: string;
    };

// DTO for board creation response
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

/**
 * Server Action for creating a new board
 * Validates input, calls application service, and returns plain JSON
 */
export async function createBoardAction(input: CreateBoardInput): Promise<ActionResult<BoardDTO>> {
    try {
        // Validate input
        const validationResult = createBoardSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { title, ownerId } = validationResult.data;

        // Instantiate repositories and service
        const boardRepository = new PrismaBoardRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardService = new BoardApplicationService(boardRepository, columnRepository);

        // Create board using application service
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

        // Convert Domain Entity to plain object
        const board = result.value;
        const boardDTO: BoardDTO = {
            id: board.id.toString(),
            title: board.title,
            ownerId: board.ownerId.toString(),
            createdAt: board.createdAt.toISOString(),
            updatedAt: board.updatedAt.toISOString(),
        };

        // Revalidate boards list
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