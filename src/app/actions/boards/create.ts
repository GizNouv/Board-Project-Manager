'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { createBoardSchema, type CreateBoardInput, type BoardDTO } from './types';

export const createBoardAction = createAction<CreateBoardInput, BoardDTO>({
    handler: async ({ input }) => {
        const boardService = container.getBoardService();

        const result = await boardService.createBoard({
            title: input.title,
            ownerId: input.ownerId,
        });

        if (!result.isSuccess()) {
            throw new Error(result.error.message);
        }

        const board = result.value;
        return {
            success: true,
            data: {
                id: board.id.toString(),
                title: board.title,
                ownerId: board.ownerId.toString(),
                createdAt: board.createdAt.toISOString(),
                updatedAt: board.updatedAt.toISOString(),
            },
        };
    },
})
    .withValidation(createBoardSchema)
    .withAuth()
    .withRevalidation('/boards');