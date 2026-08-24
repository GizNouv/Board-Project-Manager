'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { deleteTaskSchema, type DeleteTaskInput } from './types';

export const deleteTaskAction = createAction<DeleteTaskInput, void>({
  handler: async ({ input }) => {
    const taskService = container.getTaskService();
    const result = await taskService.deleteTask(input.taskId);

    if (!result.isSuccess()) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      data: undefined,
    };
  },
})
  .withValidation(deleteTaskSchema)
  .withAuth()
  .withRevalidation((input) => `/boards/${input.columnId}`)
  .build();