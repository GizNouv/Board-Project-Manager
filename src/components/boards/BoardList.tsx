import { cn } from '@/lib/utils';
import { BoardCard, type BoardCardData } from './BoardCard';

interface BoardListProps {
    boards: BoardCardData[];
    className?: string;
}

export function BoardList({ boards, className }: BoardListProps) {
    if (boards.length === 0) {
        return null;
    }

    return (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
            {boards.map((board) => (
                <BoardCard key={board.id} board={board} />
            ))}
        </div>
    );
}