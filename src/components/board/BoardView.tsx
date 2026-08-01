'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Board, Column } from '@/core/domain';
import { SortableColumn } from './SortableColumn';

interface BoardViewProps {
  board: Board;
  className?: string;
}

export function BoardView({ board: initialBoard, className }: BoardViewProps) {
  // Local state initialized from server props
  const [columns, setColumns] = useState<Column[]>(initialBoard.columns);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Reorder columns
    if (activeId.startsWith('column-') && overId.startsWith('column-')) {
      const oldIndex = columns.findIndex(col => `column-${col.id}` === activeId);
      const newIndex = columns.findIndex(col => `column-${col.id}` === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newColumns = [...columns];
        const [movedColumn] = newColumns.splice(oldIndex, 1);
        newColumns.splice(newIndex, 0, movedColumn);
        setColumns(newColumns);
      }
      return;
    }

    // Move task within same column or between columns
    const [activeColumnId, activeTaskId] = activeId.split('-task-');
    const [overColumnId, overTaskId] = overId.split('-task-');

    if (!activeTaskId || !overTaskId) return;

    // Find source and destination columns
    const sourceColumnIndex = columns.findIndex(col => col.id.toString() === activeColumnId);
    const destColumnIndex = columns.findIndex(col => col.id.toString() === overColumnId);

    if (sourceColumnIndex === -1 || destColumnIndex === -1) return;

    const sourceColumn = columns[sourceColumnIndex];
    const destColumn = columns[destColumnIndex];

    // Find task indices
    const sourceTasks = [...sourceColumn.tasks];
    const sourceTaskIndex = sourceTasks.findIndex(task => task.id.toString() === activeTaskId);

    if (sourceTaskIndex === -1) return;

    // If moving within same column
    if (activeColumnId === overColumnId) {
      const destTasks = [...sourceColumn.tasks];
      const destTaskIndex = destTasks.findIndex(task => task.id.toString() === overTaskId);

      if (destTaskIndex !== -1 && sourceTaskIndex !== destTaskIndex) {
        const [movedTask] = destTasks.splice(sourceTaskIndex, 1);
        destTasks.splice(destTaskIndex, 0, movedTask);

        const updatedColumn = new Column(
          sourceColumn.id,
          sourceColumn.title,
          sourceColumn.boardId,
          sourceColumn.order
        );
        // Re-add tasks (simplified - in real implementation we'd need proper task addition)
        destTasks.forEach(task => updatedColumn.addTask(task));

        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = updatedColumn;
        setColumns(newColumns);
      }
      return;
    }

    // Moving between different columns
    const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);

    // Find destination position
    const destTasks = [...destColumn.tasks];
    const destTaskIndex = destTasks.findIndex(task => task.id.toString() === overTaskId);

    if (destTaskIndex !== -1) {
      destTasks.splice(destTaskIndex, 0, movedTask);
    } else {
      destTasks.push(movedTask);
    }

    // Update source column
    const updatedSourceColumn = new Column(
      sourceColumn.id,
      sourceColumn.title,
      sourceColumn.boardId,
      sourceColumn.order
    );
    sourceTasks.forEach(task => updatedSourceColumn.addTask(task));

    // Update destination column
    const updatedDestColumn = new Column(
      destColumn.id,
      destColumn.title,
      destColumn.boardId,
      destColumn.order
    );
    destTasks.forEach(task => updatedDestColumn.addTask(task));

    const newColumns = [...columns];
    newColumns[sourceColumnIndex] = updatedSourceColumn;
    newColumns[destColumnIndex] = updatedDestColumn;
    setColumns(newColumns);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={columns.map(col => `column-${col.id}`)}
        strategy={horizontalListSortingStrategy}
      >
        <div className={className}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {columns.map((column) => (
              <SortableColumn key={column.id.toString()} column={column} />
            ))}
          </div>
        </div>
      </SortableContext>
      <DragOverlay>
        {activeId && activeId.startsWith('column-') && (
          <div className="opacity-50">
            {columns.find(col => `column-${col.id}` === activeId)?.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}