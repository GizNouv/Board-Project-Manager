import { requireUser } from '@/lib/session';
import { DashboardClient } from './DashboardClient';
import { container } from '@/lib/di/container';
import { notFound } from 'next/navigation';
import { BoardMapper } from '@/lib/mappers';

export default async function DashboardPage() {
  const user = await requireUser();

  // ✅ Use DI Container
  const boardService = container.getBoardService();
  const boardResult = await boardService.getFirstBoardByUser(user.id);

  if (boardResult.value.ownerId.toString() !== user.id) {
    notFound();
  }

  // ✅ Use Mapper
  const boardDTO = BoardMapper.toBoardDTO(boardResult.value);

  return <DashboardClient board={boardDTO} userName={user.name} />;
}