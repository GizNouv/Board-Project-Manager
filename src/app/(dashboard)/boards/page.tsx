import { requireUser } from '@/lib/session';
import { container } from '@/lib/di/container';
import { BoardMapper } from '@/lib/mappers/board.mapper';
import { BoardList } from '@/components/boards/BoardList';
import { BoardEmptyState } from '@/components/boards/BoardEmptyState';
import { CreateBoardDialog } from '@/components/board/CreateBoardDialog';

export default async function BoardsPage() {
  const user = await requireUser();

  // ✅ Use DI Container
  const boardService = container.getBoardService();
  const boardsResult = await boardService.getBoardsByOwner(user.id);

  // ✅ Use Mapper
  const boardDTOs = boardsResult.isSuccess()
    ? boardsResult.value.map(BoardMapper.toBoardCardDTO)
    : [];

  const hasBoards = boardDTOs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground">Manage your boards</p>
        </div>
        <CreateBoardDialog userId={user.id} />
      </div>

      {hasBoards ? <BoardList boards={boardDTOs} /> : <BoardEmptyState />}
    </div>
  );
}