// src/lib/mappers/board.mapper.ts
import { Board } from '@/core/domain/entities/Board';
import { BoardCardData } from '@/components/boards/BoardCard';
import { BoardData } from '@/types/kanban';

export class BoardMapper {
    static toBoardCardDTO(board: Board): BoardCardData {
        return {
            id: board.id.toString(),
            title: board.title,
            createdAt: board.createdAt.toISOString(),
            columnCount: board.columnCount,
        };
    }

    static toBoardDTO(board: Board): BoardData {
        return {
            id: board.id.toString(),
            title: board.title,
            columns: board.columns.map((column) => ({
                id: column.id.toString(),
                title: column.title,
                boardId: column.boardId,
                order: column.order,
                tasks: column.tasks.map((task) => ({
                    id: task.id.toString(),
                    title: task.title,
                    description: task.description,
                    columnId: column.id.toString(),
                    estimate: {
                        value: task.estimate.value,
                        unit: task.estimate.unit,
                    },
                    priority: {
                        value: task.priority.value,
                    },
                    type: task.type,
                    assigneeId: task.assigneeId?.toString() || null,
                })),
            })),
        };
    }
}