'use server';

import { createAction } from '@/lib/action-builder';
import { container } from '@/lib/di/container';
import { updateTaskSchema, type UpdateTaskInput, type TaskDTO } from './types';

export const updateTaskAction = createAction<UpdateTaskInput, TaskDTO>({
  handler: async ({ input }) => {
    const taskService = container.getTaskService();

    const updateDto: any = {};
    if (input.title !== undefined) updateDto.title = input.title;
    if (input.description !== undefined) updateDto.description = input.description;
    if (input.priority !== undefined) updateDto.priority = input.priority;
    if (input.estimate !== undefined) {
      updateDto.estimate = {
        value: input.estimate.value,
        unit: input.estimate.unit || 'hours',
      };
    }
    if (input.severity !== undefined) updateDto.severity = input.severity;
    if (input.complexity !== undefined) updateDto.complexity = input.complexity;
    if (input.assigneeId !== undefined) updateDto.assigneeId = input.assigneeId;

    const result = await taskService.updateTask(input.taskId, updateDto);

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
  .withValidation(updateTaskSchema)
  .withAuth()
  .withRevalidation((input) => `/boards/${input.columnId}`)
  .build();