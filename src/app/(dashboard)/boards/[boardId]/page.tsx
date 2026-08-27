import { requireUser } from '@/lib/session';
import { container } from '@/lib/di/container';
import { BoardMapper } from '@/lib/mappers/board.mapper';
import { notFound } from 'next/navigation';
import { BoardClient } from './BoardClient';

interface BoardPageProps {
    params: Promise<{
        boardId: string;
    }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
    const user = await requireUser();
    const { boardId } = await params;

    // ✅ Use DI Container
    const boardService = container.getBoardService();
    const boardResult = await boardService.getBoardWithColumns(boardId);

    if (boardResult.isFailure()) {
        notFound();
    }

    const board = boardResult.value;

    if (board.ownerId.toString() !== user.id) {
        notFound();
    }

    // ✅ Use Mapper
    const boardDTO = BoardMapper.toBoardDTO(board);

    return <BoardClient board={boardDTO} boardId={boardId} />;
}