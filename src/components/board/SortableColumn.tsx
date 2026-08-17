'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnView } from './ColumnView';
import { ColumnData, TaskData } from '@/types/kanban';
import { GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SortableColumnProps {
  column: ColumnData;
  boardId: string;
  onTaskCreated?: (task: TaskData) => void;
  onTaskUpdated?: (task: TaskData) => void;
  onTaskDeleted?: (taskId: string) => void;
  onColumnUpdated?: (column: ColumnData) => void;
  onColumnDeleted?: (columnId: string) => void;
  onColumnCreated?: (column: ColumnData) => void;  // ✅ Add this
}

export function SortableColumn({
  column,
  boardId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onColumnUpdated,
  onColumnDeleted,
  onColumnCreated,  // ✅ Add this
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    over,
    active,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const [dropPosition, setDropPosition] = useState<'left' | 'right' | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isDropTarget = over?.id === `column-${column.id}` && !isDragging && active?.id !== `column-${column.id}`;

  // Update drop position when hovering over the column
  useEffect(() => {
    if (isDropTarget && over) {
      const element = document.querySelector(`[data-column-id="${column.id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        let mouseX = rect.left + rect.width / 2;
        if ((over as any).rect?.left !== undefined) {
          mouseX = (over as any).rect.left;
        }
        const isLeftHalf = mouseX < rect.left + rect.width / 2;
        setDropPosition(isLeftHalf ? 'left' : 'right');
      }
    } else {
      setDropPosition(null);
    }
  }, [isDropTarget, over, column.id]);

  // Real-time mouse tracking for drop position
  useEffect(() => {
    if (!isDropTarget) {
      setDropPosition(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const element = document.querySelector(`[data-column-id="${column.id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isLeftHalf = e.clientX < rect.left + rect.width / 2;
        setDropPosition(isLeftHalf ? 'left' : 'right');
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, [isDropTarget, column.id]);

  // Handle keyboard events to prevent Space from triggering drag
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    // Check if any modal/dialog/sheet is open
    const isModalOpen = !!(
      document.querySelector('[role="dialog"][data-state="open"]') ||
      document.querySelector('[role="dialog"]:not([data-state="closed"])') ||
      document.querySelector('[data-state="open"][role="dialog"]') ||
      document.querySelector('[role="presentation"]') ||
      document.querySelector('.sheet-content') ||
      document.querySelector('[data-radix-dialog-content]') ||
      document.querySelector('[data-radix-sheet-content]')
    );

    if (isModalOpen) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }

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
      target.closest('[role="presentation"]') !== null ||
      target.closest('[contenteditable="true"]') !== null;

    if (isFormElement) {
      return;
    }

    // Only prevent Space key on non-form elements to avoid drag
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-full cursor-grab active:cursor-grabbing relative flex-shrink-0 w-[280px]"
      data-column-id={column.id}
      onKeyDown={handleKeyDown}
    >
      {isDropTarget && dropPosition === 'left' && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full shadow-lg z-20 animate-pulse" />
      )}

      {isDropTarget && dropPosition === 'right' && (
        <div className="absolute -right-2 top-0 bottom-0 w-1 bg-purple-500 rounded-full shadow-lg z-20 animate-pulse" />
      )}

      <div className="relative h-full">
        <div
          className="absolute -left-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent opacity-50 hover:opacity-100 z-10"
          aria-label="Drag column"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <ColumnView
          column={column}
          boardId={boardId}
          onTaskCreated={onTaskCreated}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
          onColumnUpdated={onColumnUpdated}
          onColumnDeleted={onColumnDeleted}
          onColumnCreated={onColumnCreated}  // ✅ Pass through
        />
      </div>
    </div>
  );
}