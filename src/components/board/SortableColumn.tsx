'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnView } from './ColumnView';
import { ColumnData, TaskData } from '@/types/kanban';
import { GripVertical } from 'lucide-react';
import { useEffect } from 'react';

interface SortableColumnProps {
  column: ColumnData;
  boardId: string;
  onTaskCreated?: (task: TaskData) => void;
  onTaskUpdated?: (task: TaskData) => void;
  onColumnUpdated?: (column: ColumnData) => void;
}

export function SortableColumn({
  column,
  boardId,
  onTaskCreated,
  onTaskUpdated,
  onColumnUpdated
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    console.log(`📋 SortableColumn ${column.id} (${column.title}) rendered, isDragging:`, isDragging);
  }, [isDragging, column.id, column.title]);

  // Handle keyboard events to prevent Space from triggering drag on form elements
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    // Check if the target or its parent is a form element
    const isFormElement =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'BUTTON' ||
      target.closest('input') !== null ||
      target.closest('textarea') !== null ||
      target.closest('select') !== null ||
      target.closest('button') !== null ||
      target.closest('[role="dialog"]') !== null ||
      target.closest('[contenteditable="true"]') !== null;

    if (isFormElement) {
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full cursor-grab active:cursor-grabbing relative"
      data-column-id={column.id}
      onKeyDown={handleKeyDown}
    >
      {isDragging && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-lg z-10" />
      )}

      <div className="relative">
        <div
          className="absolute -left-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent opacity-50 hover:opacity-100"
          aria-label="Drag column"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <ColumnView
          column={column}
          boardId={boardId}
          onTaskCreated={onTaskCreated}
          onTaskUpdated={onTaskUpdated}
          onColumnUpdated={onColumnUpdated}
        />
      </div>
    </div>
  );
}