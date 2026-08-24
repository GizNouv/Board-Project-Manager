'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { moveTaskSchema, type MoveTaskInput } from './types';

export const moveTaskAction = createAction<MoveTaskInput, void>({
  handler: async ({ input }) => {
    const boardService = container.getBoardService();

    const result = await boardService.moveTask(
      input.taskId,
      input.sourceColumnId,
      input.targetColumnId,
      input.targetOrder,
      input.sourceTaskIds,
      input.targetTaskIds
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
  .withValidation(moveTaskSchema)
  .withAuth()
  .withRevalidation((input) => `/boards/${input.sourceColumnId}`)
  .build();