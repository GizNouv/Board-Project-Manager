'use client';

import { useState, useCallback } from 'react';
import { BoardView } from '@/components/board/BoardView';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardData } from '@/types/kanban';
import { EmptyColumnState } from '@/components/board/EmptyColumnState';

interface BoardClientProps {
    board: BoardData;
    boardId: string;
}

export function BoardClient({ board: initialBoard, boardId }: BoardClientProps) {
    const [board, setBoard] = useState<BoardData>(initialBoard);

    const handleBoardUpdated = useCallback((updatedBoard: { id: string; title: string }) => {
        setBoard((prev) => ({
            ...prev,
            title: updatedBoard.title,
        }));
    }, []);

    const handleColumnCreated = useCallback((newColumn: any) => {
        setBoard((prev) => ({
            ...prev,
            columns: [...prev.columns, newColumn],
        }));
    }, []);

    const handleColumnDeleted = useCallback((columnId: string) => {
        setBoard((prev) => ({
            ...prev,
            columns: prev.columns.filter((col) => col.id !== columnId),
        }));
    }, []);

    const handleBoardDeleted = useCallback(() => {
        // The router will handle navigation
    }, []);

    const hasColumns = initialBoard.columns && initialBoard.columns.length > 0;

    return (
        <div className="space-y-6">
            <div>status: {hasColumns}</div>
            <BoardHeader
                title={board.title}
                boardId={boardId}
                updatedAt={board.updatedAt}
                onColumnCreated={handleColumnCreated}
                onBoardUpdated={handleBoardUpdated}
                onBoardDeleted={handleBoardDeleted}
            />

            {hasColumns ? (
                <BoardView board={board} />
            ) : (
                <EmptyColumnState boardId={boardId} />
            )}
        </div>
    );
}