'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { reorderTasksSchema, type ReorderTasksInput } from './types';

export const reorderTasksAction = createAction<ReorderTasksInput, void>({
  handler: async ({ input }) => {
    const boardService = container.getBoardService();

    const result = await boardService.reorderTasks(
      input.columnId,
      input.orderedTaskIds
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
  .withValidation(reorderTasksSchema)
  .withAuth()
  .withRevalidation(({ input }) => `/boards/${input.columnId}`);