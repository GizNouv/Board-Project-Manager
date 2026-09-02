'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import { ColumnData } from '@/types/kanban';
import { ColumnView } from './ColumnView';

interface SortableColumnProps {
  column: ColumnData;
  index: number;
  boardId: string;
}

export function SortableColumn({
  column,
  index,
  boardId
}: SortableColumnProps) {
  // Columns are a single implicit group (no `group` option needed —
  // there's only one row of columns), separate `type`/`accept` so
  // columns only interact with other columns, never with tasks.
  const { ref, isDragging } = useSortable({
    id: `column-${column.id}`,
    index,
    type: 'column',
    accept: 'column',
  });

  return (
    <div
      ref={ref}
      className="cursor-grab active:cursor-grabbing relative flex-shrink-0 w-[280px] h-[calc(100svh-230px)] overflow-hidden mb-4"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      data-column-id={column.id}
    >
      <ColumnView
        column={column}
        boardId={boardId}
      />
    </div>
  );
}