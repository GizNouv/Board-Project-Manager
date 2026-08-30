// src/lib/mappers/column.mapper.ts
import { ColumnDTO } from '@/app/actions/columns/types';
import { ColumnData } from '@/types/kanban';
import { TaskMapper } from './task.mapper';

export class ColumnMapper {
    /**
     * Convert ColumnDTO (from server) to ColumnData (client-side)
     */
    static toColumnData(dto: ColumnDTO, tasks: ColumnData['tasks'] = []): ColumnData {
        return {
            id: dto.id,
            title: dto.title,
            boardId: dto.boardId,
            order: dto.order,
            tasks,
        };
    }

    /**
     * Convert ColumnData (client-side) to ColumnDTO (for server)
     * Note: Only includes primitive fields, not tasks
     */
    static toColumnDTO(data: ColumnData): Omit<ColumnDTO, 'createdAt' | 'updatedAt'> {
        return {
            id: data.id,
            title: data.title,
            boardId: data.boardId,
            order: data.order,
        };
    }
}