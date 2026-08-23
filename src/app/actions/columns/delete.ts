'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { deleteColumnSchema, type DeleteColumnInput } from './types';

export const deleteColumnAction = createAction<DeleteColumnInput, void>({
    handler: async ({ input }) => {
        const boardService = container.getBoardService();
        const result = await boardService.deleteColumn(input.columnId);

        if (!result.isSuccess()) {
            throw new Error(result.error.message);
        }

        return {
            success: true,
            data: undefined,
        };
    },
})
    .withValidation(deleteColumnSchema)
    .withAuth()
    .withRevalidation(({ input }) => `/boards/${input.boardId}`);