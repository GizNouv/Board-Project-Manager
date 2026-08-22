'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import { ColumnData, TaskData } from '@/types/kanban';
import { ColumnView } from './ColumnView';

interface SortableColumnProps {
  column: ColumnData;
  index: number;
  boardId: string;
  onTaskCreated?: (task: TaskData) => void;
  onTaskUpdated?: (task: TaskData) => void;
  onTaskDeleted?: (taskId: string) => void;
  onColumnUpdated?: (column: ColumnData) => void;
  onColumnDeleted?: (columnId: string) => void;
  onColumnCreated?: (column: ColumnData) => void;
}

export function SortableColumn({
  column,
  index,
  boardId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onColumnUpdated,
  onColumnDeleted,
  onColumnCreated,
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
        onTaskCreated={onTaskCreated}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
        onColumnUpdated={onColumnUpdated}
        onColumnDeleted={onColumnDeleted}
        onColumnCreated={onColumnCreated}
      />
    </div>
  );
}