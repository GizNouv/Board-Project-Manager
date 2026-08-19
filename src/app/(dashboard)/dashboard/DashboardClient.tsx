'use client';

import { useState, useCallback } from 'react';
import { BoardView } from '@/components/board/BoardView';
import { EditBoardDialog } from '@/components/board/EditBoardDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BoardData } from '@/types/kanban';

interface DashboardClientProps {
    board: BoardData;
}

export function DashboardClient({ board: initialBoard }: DashboardClientProps) {
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </div>

            <BoardView board={board} />
        </div>
    );
}