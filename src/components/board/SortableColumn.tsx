'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnView } from './ColumnView';

interface ColumnData {
  id: string;
  title: string;
  boardId: string;
  order: number;
  tasks: TaskData[];
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  estimate: {
    value: number;
    unit: string;
  };
  priority: {
    value: string;
  };
  type: string;
  assigneeId: string | null;
}

interface SortableColumnProps {
  column: ColumnData;
}

export function SortableColumn({ column }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `column-${column.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full"
    >
      <ColumnView column={column} />
    </div>
  );
}