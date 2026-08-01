import { Board } from '@/core/domain';
import { ColumnView } from './ColumnView';

interface BoardViewProps {
  board: Board;
  className?: string;
}

export function BoardView({ board, className }: BoardViewProps) {
  const columns = board.columns;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {columns.map((column) => (
          <ColumnView key={column.id.toString()} column={column} />
        ))}
      </div>
    </div>
  );
}