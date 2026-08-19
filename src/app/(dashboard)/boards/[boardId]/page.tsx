import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { notFound } from 'next/navigation';
import { BoardData } from '@/types/kanban';
import { BoardClient } from './BoardClient';

interface BoardPageProps {
    params: Promise<{
        boardId: string;
    }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
    const user = await requireUser();
    const { boardId } = await params;

    const boardRepository = new PrismaBoardRepository();
    const columnRepository = new PrismaColumnRepository();
    const boardService = new BoardApplicationService(boardRepository, columnRepository);

    const boardResult = await boardService.getBoardWithColumns(boardId);

    if (boardResult.isFailure()) {
        notFound();
    }

    const board = boardResult.value;

    if (board.ownerId.toString() !== user.id) {
        notFound();
    }

    const boardDTO: BoardData = {
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

    return <BoardClient board={boardDTO} boardId={boardId} />;
}