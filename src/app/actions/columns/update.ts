'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { updateColumnSchema, type UpdateColumnInput, type ColumnDTO } from './types';

export const updateColumnAction = createAction<UpdateColumnInput, ColumnDTO>({
    handler: async ({ input }) => {
        const boardService = container.getBoardService();

        const result = await boardService.updateColumn(input.columnId, {
            title: input.title,
        });

        if (!result.isSuccess()) {
            throw new Error(result.error.message);
        }

        const column = result.value;
        return {
            success: true,
            data: {
                id: column.id.toString(),
                title: column.title,
                boardId: column.boardId.toString(),
                order: column.order,
                createdAt: column.createdAt.toISOString(),
                updatedAt: column.updatedAt.toISOString(),
            },
        };
    },
})
    .withValidation(updateColumnSchema)
    .withAuth()
    .withRevalidation((input) => `/boards/${input.boardId}`)
    .build();