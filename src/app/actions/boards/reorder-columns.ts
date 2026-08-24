'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { reorderColumnsSchema, type ReorderColumnsInput } from './types';

export const reorderColumnsAction = createAction<ReorderColumnsInput, void>({
    handler: async ({ input }) => {
        const boardService = container.getBoardService();

        // ✅ اصلاح: reorderColumns → reorderColumn
        const result = await boardService.reorderColumn(
            input.columnId,
            input.newOrder
        );

        if (!result.isSuccess()) {
            throw new Error(result.error.message);
        }

        return {
            success: true,
            data: undefined,
        };
    },
})
    .withValidation(reorderColumnsSchema)
    .withAuth()
    .withRevalidation((input) => `/boards/${input.boardId}`)
    .build();