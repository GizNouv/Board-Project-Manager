import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { BoardView } from '@/components/board/BoardView';
import { EmptyBoardState } from '@/components/board/EmptyBoardState';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireUser();

  // Instantiate repositories and services
  const boardRepository = new PrismaBoardRepository();
  const columnRepository = new PrismaColumnRepository();
  const boardService = new BoardApplicationService(boardRepository, columnRepository);

  // Load the user's first board
  const boardResult = await boardService.getFirstBoardByUser(user.id);

  // If no board exists, show empty state
  if (boardResult.isFailure()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your task board. Get started by creating your first board.
            </p>
          </div>
        </div>
        <EmptyBoardState />
      </div>
    );
  }

  const board = boardResult.value;

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
        columnId: column.id.toString(), // Add this
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <BoardView board={boardDTO} />
    </div>
  );
}