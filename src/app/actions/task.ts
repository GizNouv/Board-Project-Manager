'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TaskApplicationService } from '@/core/application/services/TaskApplicationService';
import { PrismaTaskRepository } from '@/core/infrastructure/repositories/PrismaTaskRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
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

// ============== REORDER TASKS SCHEMA ==============

const reorderTasksSchema = z.object({
    columnId: z.string().min(1, 'Column ID is required'),
    orderedTaskIds: z.array(z.string()).min(1, 'At least one task ID is required'),
});

export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;

// ============== MOVE TASK SCHEMA ==============

const moveTaskSchema = z.object({
    taskId: z.string().min(1, 'Task ID is required'),
    sourceColumnId: z.string().min(1, 'Source column ID is required'),
    targetColumnId: z.string().min(1, 'Target column ID is required'),
    targetOrder: z.number().min(0, 'Target order must be positive'),
    sourceTaskIds: z.array(z.string()), // Empty array is allowed (source column becomes empty)
    targetTaskIds: z.array(z.string()).min(1, 'Target task IDs are required'),
});

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;

// ============== CREATE TASK ==============

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

// ============== REORDER TASKS ACTION ==============

export async function reorderTasksAction(input: ReorderTasksInput): Promise<ActionResult<void>> {
    console.log('🔵 reorderTasksAction called');
    console.log('  input:', input);

    try {
        const validationResult = reorderTasksSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                message: firstError.message,
            };
        }

        const { columnId, orderedTaskIds } = validationResult.data;

        const boardRepository = new PrismaBoardRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardService = new BoardApplicationService(boardRepository, columnRepository);

        const result = await boardService.reorderTasks(columnId, orderedTaskIds);

        if (!result.isSuccess()) {
            return {
                success: false,
                message: result.error.message,
            };
        }

        const boardResult = await boardRepository.findBoardByColumnId(new ColumnId(columnId));
        if (boardResult.isSuccess()) {
            const board = boardResult.value;
            revalidatePath(`/boards/${board.id}`);
        }

        return {
            success: true,
            data: undefined,
        };
    } catch (error) {
        console.error('❌ reorderTasksAction error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred while reordering tasks',
        };
    }
}

// ============== MOVE TASK ACTION ==============

export async function moveTaskAction(input: MoveTaskInput): Promise<ActionResult<void>> {
    console.log('🔵 [MOVE ACTION]');
    console.log('  taskId:', input.taskId);
    console.log('  sourceColumnId:', input.sourceColumnId);
    console.log('  targetColumnId:', input.targetColumnId);
    console.log('  targetOrder:', input.targetOrder);
    console.log('  sourceTaskIds:', input.sourceTaskIds);
    console.log('  targetTaskIds:', input.targetTaskIds);

    try {
        const validationResult = moveTaskSchema.safeParse(input);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            console.log('[MOVE ACTION] ❌ Validation failed:', firstError.message);
            return {
                success: false,
                message: firstError.message,
            };
        }

        const {
            taskId,
            sourceColumnId,
            targetColumnId,
            targetOrder,
            sourceTaskIds,
            targetTaskIds
        } = validationResult.data;

        console.log('[MOVE ACTION] Validation passed, calling boardService.moveTask...');

        const boardRepository = new PrismaBoardRepository();
        const columnRepository = new PrismaColumnRepository();
        const boardService = new BoardApplicationService(boardRepository, columnRepository);

        const result = await boardService.moveTask(
            taskId,
            sourceColumnId,
            targetColumnId,
            targetOrder,
            sourceTaskIds,
            targetTaskIds
        );

        if (!result.isSuccess()) {
            console.log('[MOVE ACTION] ❌ boardService.moveTask failed:', result.error.message);
            return {
                success: false,
                message: result.error.message,
            };
        }

        console.log('[MOVE ACTION] ✅ boardService.moveTask succeeded');

        const boardResult = await boardRepository.findBoardByColumnId(new ColumnId(sourceColumnId));
        if (boardResult.isSuccess()) {
            const board = boardResult.value;
            revalidatePath(`/boards/${board.id}`);
        }

        return {
            success: true,
            data: undefined,
        };
    } catch (error) {
        console.error('[MOVE ACTION] ❌ Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred while moving the task',
        };
    }
}