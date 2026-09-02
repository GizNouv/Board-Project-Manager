'use client';

import { useEffect } from 'react';
import { BoardView } from '@/components/board/BoardView';
import { BoardHeader } from '@/components/board/BoardHeader';
import { BoardData } from '@/types/kanban';
import { EmptyColumnState } from '@/components/board/EmptyColumnState';
import { useBoardStore } from '@/stores/boardStore';
import { ColumnData } from '@/types/kanban';

interface BoardClientProps {
    board: BoardData;
    boardId: string;
}

export function BoardClient({ board: initialBoard, boardId }: BoardClientProps) {
    const setColumns = useBoardStore((state) => state.setColumns);
    const setBoardId = useBoardStore((state) => state.setBoardId);

    // Initialize store on mount
    useEffect(() => {
        const currentBoardId = useBoardStore.getState().boardId;
        if (currentBoardId !== boardId) {
            const columnsRecord = initialBoard.columns.reduce((acc, col) => {
                acc[col.id] = col;
                return acc;
            }, {} as Record<string, ColumnData>);

            setColumns(columnsRecord, initialBoard.columns.map((col) => col.id));
            setBoardId(boardId);
        }
    }, [boardId, initialBoard, setColumns, setBoardId]);

    const hasColumns = initialBoard.columns.length > 0;

    return (
        <div className="space-y-6">
            <BoardHeader
                title={initialBoard.title}
                boardId={boardId}
                updatedAt={initialBoard.updatedAt}
            />

            {hasColumns ? (
                <BoardView />
            ) : (
                <EmptyColumnState boardId={boardId} />
            )}
        </div>
    );
}