'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TaskApplicationService } from '@/core/application/services/TaskApplicationService';
import { PrismaTaskRepository } from '@/core/infrastructure/repositories/PrismaTaskRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { ROUTES } from '@/config/routes';
import { ResultFactory, ValidationException, TaskId, ColumnId } from '@/core/domain';

export type ActionResult<T> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        message: string;
    };

export interface TaskDTO {
    id: string;
    title: string;
    description: string;
    priority: string;
    estimate: number;
    estimateUnit: string;
    type: string;
    assigneeId: string | null;
    columnId: string;
    createdAt: string;
    updatedAt: string;
}

const createTaskSchema = z.object({
    title: z.string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must not exceed 200 characters')
        .trim(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimate: z.number().min(0, 'Estimate must be a positive number'),
    estimateUnit: z.enum(['hours', 'days']),
    columnId: z.string().min(1, 'Column ID is required'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

const reorderTaskSchema = z.object({
    columnId: z.string().min(1, 'Column ID is required'),
    taskId: z.string().min(1, 'Task ID is required'),
    newOrder: z.number().min(0, 'Order must be a positive number'),
});

export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;

const moveTaskSchema = z.object({
    taskId: z.string().min(1, 'Task ID is required'),
    fromColumnId: z.string().min(1, 'Source column ID is required'),
    toColumnId: z.string().min(1, 'Destination column ID is required'),
    newOrder: z.number().optional(),
});

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

export async function createTaskAction(input: CreateTaskInput): Promise<ActionResult<TaskDTO>> {
    try {
        const validationResult = createTaskSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { title, description, priority, estimate, estimateUnit, columnId } = validationResult.data;

        const taskRepository = new PrismaTaskRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardRepository = new PrismaBoardRepository();
        const taskService = new TaskApplicationService(taskRepository, columnRepository, boardRepository);

        const result = await taskService.createTask({
            title,
            description: description || '',
            estimate: {
                value: estimate,
                unit: estimateUnit,
            },
            priority,
            columnId,
            type: 'FEATURE',
        });

        if (!result.isSuccess()) {
            return {
                success: false,
                message: result.error.message,
            };
        }

        const task = result.value;
        const taskDTO: TaskDTO = {
            id: task.id.toString(),
            title: task.title,
            description: task.description,
            priority: task.priority.value,
            estimate: task.estimate.value,
            estimateUnit: task.estimate.unit,
            type: task.type,
            assigneeId: task.assigneeId?.toString() || null,
            columnId: columnId,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
        };

        revalidatePath(`/boards/${columnId}`);

        return {
            success: true,
            data: taskDTO,
        };
    } catch (error) {
        console.error('Create task action error:', error);
        return {
            success: false,
            message: 'An unexpected error occurred while creating the task',
        };
    }
}

/**
 * Server Action for reordering tasks within the same column
 */
export async function reorderTaskAction(input: ReorderTaskInput): Promise<ActionResult<void>> {
    try {
        const validationResult = reorderTaskSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { columnId, taskId, newOrder } = validationResult.data;

        const boardRepository = new PrismaBoardRepository();

        const boardResult = await boardRepository.findBoardByColumnId(new ColumnId(columnId));
        if (!boardResult.isSuccess()) {
            return {
                success: false,
                message: boardResult.error.message,
            };
        }

        const board = boardResult.value;
        board.reorderTaskInColumn(new ColumnId(columnId), new TaskId(taskId), newOrder);

        const saveResult = await boardRepository.saveBoardWithColumns(board);
        if (!saveResult.isSuccess()) {
            return {
                success: false,
                message: saveResult.error.message,
            };
        }

        revalidatePath(`/boards/${board.id}`);

        return {
            success: true,
            data: undefined,
        };
    } catch (error) {
        console.error('Reorder task action error:', error);
        if (error instanceof ValidationException) {
            return {
                success: false,
                message: error.message,
            };
        }
        return {
            success: false,
            message: 'An unexpected error occurred while reordering tasks',
        };
    }
}

/**
 * Server Action for moving a task to another column
 */
export async function moveTaskAction(input: MoveTaskInput): Promise<ActionResult<void>> {
    try {
        const validationResult = moveTaskSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { taskId, fromColumnId, toColumnId, newOrder } = validationResult.data;

        const boardRepository = new PrismaBoardRepository();

        const boardResult = await boardRepository.findBoardByColumnId(new ColumnId(fromColumnId));
        if (!boardResult.isSuccess()) {
            return {
                success: false,
                message: boardResult.error.message,
            };
        }

        const board = boardResult.value;
        board.moveTask(
            new TaskId(taskId),
            new ColumnId(fromColumnId),
            new ColumnId(toColumnId),
            newOrder
        );

        const saveResult = await boardRepository.saveBoardWithColumns(board);
        if (!saveResult.isSuccess()) {
            return {
                success: false,
                message: saveResult.error.message,
            };
        }

        revalidatePath(`/boards/${board.id}`);

        return {
            success: true,
            data: undefined,
        };
    } catch (error) {
        console.error('Move task action error:', error);
        if (error instanceof ValidationException) {
            return {
                success: false,
                message: error.message,
            };
        }
        return {
            success: false,
            message: 'An unexpected error occurred while moving the task',
        };
    }
}