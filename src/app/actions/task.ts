'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TaskApplicationService } from '@/core/application/services/TaskApplicationService';
import { PrismaTaskRepository } from '@/core/infrastructure/repositories/PrismaTaskRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { ROUTES } from '@/config/routes';

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

/**
 * Server Action for creating a new task
 * Validates input, calls application service, and returns plain JSON
 */
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

        // Instantiate repositories and service
        const taskRepository = new PrismaTaskRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardRepository = new PrismaBoardRepository();
        const taskService = new TaskApplicationService(taskRepository, columnRepository, boardRepository);

        // Create task using application service
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