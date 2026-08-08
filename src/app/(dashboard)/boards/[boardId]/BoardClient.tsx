'use client';

import { useState, useCallback } from 'react';
import { BoardView } from '@/components/board/BoardView';
import { EditBoardDialog } from '@/components/board/EditBoardDialog';
import { BoardData } from '@/types/kanban';

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{board.title}</h1>
                    <EditBoardDialog
                        board={board}
                        onBoardUpdated={handleBoardUpdated}
                    />
                    <p className="text-muted-foreground ml-4">
                        Manage your tasks and track progress
                    </p>
                </div>
            </div>

            <BoardView board={board} />
        </div>
    );
}