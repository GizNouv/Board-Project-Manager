import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { EmptyBoardState } from '@/components/board/EmptyBoardState';
import { BoardData } from '@/types/kanban';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const user = await requireUser();

  const boardRepository = new PrismaBoardRepository();
  const columnRepository = new PrismaColumnRepository();
  const boardService = new BoardApplicationService(boardRepository, columnRepository);

  const boardResult = await boardService.getFirstBoardByUser(user.id);

  if (boardResult.isFailure()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your task board. Get started by creating your first board.
          </p>
        </div>
        <EmptyBoardState />
      </div>
    );
  }

  const board = boardResult.value;

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

  // return <DashboardClient board={boardDTO} />;
  return;
}