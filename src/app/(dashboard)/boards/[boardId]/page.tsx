import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { BoardView } from '@/components/board/BoardView';
import { notFound } from 'next/navigation';

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

    // Verify the board belongs to the current user
    if (board.ownerId.toString() !== user.id) {
        notFound();
    }

    // Convert Domain Entities to plain objects for client components
    const boardDTO = {
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{board.title}</h1>
                    <p className="text-muted-foreground">
                        Manage your tasks and track progress
                    </p>
                </div>
            </div>

            <BoardView board={boardDTO} />
        </div>
    );
}