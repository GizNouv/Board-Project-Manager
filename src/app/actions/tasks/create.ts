'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { createTaskSchema, type CreateTaskInput, type TaskDTO } from './types';

export const createTaskAction = createAction<CreateTaskInput, TaskDTO>({
  handler: async ({ input }) => {
    const taskService = container.getTaskService();
    
    const result = await taskService.createTask({
      title: input.title,
      description: input.description || '',
      estimate: { value: input.estimate, unit: input.estimateUnit },
      priority: input.priority,
      columnId: input.columnId,
      type: input.type || 'FEATURE',
    });

    if (!result.isSuccess()) {
      throw new Error(result.error.message);
    }

    const task = result.value;
    // ✅ Return wrapped in ActionResult
    return {
      success: true,
      data: {
        id: task.id.toString(),
        title: task.title,
        description: task.description,
        priority: task.priority.value,
        estimate: task.estimate.value,
        estimateUnit: task.estimate.unit,
        type: task.type,
        assigneeId: task.assigneeId?.toString() || null,
        columnId: input.columnId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      }
    };
  },
})
.withValidation(createTaskSchema)
.withAuth()
.withRevalidation(({ input }) => `/boards/${input.columnId}`);