// src/lib/mappers/task.mapper.ts

import { TaskDTO } from '@/app/actions/tasks/types';
import { TaskEstimateUnitEnum } from '@/types';
import { TaskData } from '@/types/kanban';

export class TaskMapper {
    /**
     * Convert TaskDTO (from server) to TaskData (client-side)
     */
    static toTaskData(dto: TaskDTO): TaskData {
        return {
            id: dto.id,
            title: dto.title,
            description: dto.description,
            columnId: dto.columnId,
            estimate: {
                value: dto.estimate,
                unit: dto.estimateUnit,
            },
            priority: dto.priority,
            type: dto.type,
            assigneeId: dto.assigneeId,
            severity: dto.severity || undefined,
            complexity: dto.complexity || undefined,
        };
    }

    /**
     * Convert TaskData (client-side) to TaskDTO (for server)
     */
    static toTaskDTO(data: TaskData): Omit<TaskDTO, 'createdAt' | 'updatedAt'> {
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            columnId: data.columnId,
            estimate: data.estimate.value,
            estimateUnit: data.estimate.unit || TaskEstimateUnitEnum.HOURS,
            priority: data.priority,
            type: data.type,
            assigneeId: data.assigneeId ?? null,
            severity: data.severity,
            complexity: data.complexity,
        };
    }
}