import { requireUser } from '@/lib/session';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { PrismaBoardRepository } from '@/core/infrastructure/repositories/PrismaBoardRepository';
import { PrismaColumnRepository } from '@/core/infrastructure/repositories/PrismaColumnRepository';
import { BoardList } from '@/components/boards/BoardList';
import { BoardEmptyState } from '@/components/boards/BoardEmptyState';
import { CreateBoardDialog } from '@/components/board/CreateBoardDialog';
import { type BoardCardData } from '@/components/boards/BoardCard';

export default async function BoardsPage() {
  const user = await requireUser();

  const boardRepository = new PrismaBoardRepository();
  const columnRepository = new PrismaColumnRepository();
  const boardService = new BoardApplicationService(boardRepository, columnRepository);

  const boardsResult = await boardService.getBoardsByOwner(user.id);

  // Convert Domain Entities to serializable DTOs
  const boardDTOs: BoardCardData[] = boardsResult.isSuccess()
    ? boardsResult.value.map((board) => ({
        id: board.id.toString(),
        title: board.title,
        createdAt: board.createdAt.toISOString(),
        columnCount: board.columnCount,
      }))
    : [];

  const hasBoards = boardDTOs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground">
            Manage your boards
          </p>
        </div>
        <CreateBoardDialog userId={user.id} />
      </div>

      {hasBoards ? (
        <BoardList boards={boardDTOs} />
      ) : (
        <BoardEmptyState />
      )}
    </div>
  );
}