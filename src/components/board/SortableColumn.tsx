'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnView } from './ColumnView';
import { ColumnData } from '@/types/kanban';
import { GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

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

  // Log when SortableColumn renders with drag state
  useEffect(() => {
    console.log(`📋 SortableColumn ${column.id} (${column.title}) rendered, isDragging:`, isDragging);
  }, [isDragging, column.id, column.title]);

  // Handle keyboard events to prevent Space from triggering drag on form elements
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

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

  // Determine if this column is being hovered over during a drag (drop target)
  const isDropTarget = over?.id === `column-${column.id}` && !isDragging && active?.id !== `column-${column.id}`;

  // Update drop position when hovering over the column
  useEffect(() => {
    if (isDropTarget && over) {
      const element = document.querySelector(`[data-column-id="${column.id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Try to get mouse position from the over event
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
      {/* Drop indicator - LEFT side (column will be inserted BEFORE this one) */}
      {isDropTarget && dropPosition === 'left' && (
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-lg z-20" />
      )}

      {/* Drop indicator - RIGHT side (column will be inserted AFTER this one) */}
      {isDropTarget && dropPosition === 'right' && (
        <div className="absolute -right-2 top-0 bottom-0 w-1 bg-primary rounded-full shadow-lg z-20" />
      )}

      <div className="relative">
        {/* Drag Handle for visual indication */}
        <div
          className="absolute -left-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-accent opacity-50 hover:opacity-100"
          aria-label="Drag column"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <ColumnView column={column} />
      </div>
    </div>
  );
}