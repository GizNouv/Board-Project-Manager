'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { SortableColumn } from './SortableColumn';
import { ColumnData, TaskData } from '@/types/kanban';
import { reorderColumnsAction } from '@/app/actions/board';
import { reorderTaskAction, moveTaskAction } from '@/app/actions/task';

interface BoardViewProps {
  board: {
    id: string;
    title: string;
    columns: ColumnData[];
  };
  className?: string;
}

export function BoardView({ board: initialBoard, className }: BoardViewProps) {
  const [columns, setColumns] = useState<ColumnData[]>(initialBoard.columns);
  const [activeColumn, setActiveColumn] = useState<ColumnData | null>(null);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const updateCounterRef = useRef(0);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const boardId = initialBoard.id;

  // Log initial state
  useEffect(() => {
    console.log('🔵 BoardView mounted with boardId:', boardId);
    console.log('  columns:', columns.map(c => ({
      id: c.id,
      title: c.title,
      order: c.order,
      taskCount: c.tasks.length,
    })));
  }, []);

  // Log every state change
  useEffect(() => {
    console.log('🔄 BoardView state updated. Columns:', columns.map(c => ({
      id: c.id,
      title: c.title,
      order: c.order,
      taskCount: c.tasks.length,
    })));
  }, [columns]);

  // Track mouse position during drag
  useEffect(() => {
    if (!activeColumn && !activeTask) {
      setMousePosition(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, [activeColumn, activeTask]);

  // Droppable container for dropping at the end of columns
  const { setNodeRef: setContainerRef, isOver: isContainerOver } = useDroppable({
    id: 'columns-container',
    data: {
      type: 'container',
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;

    console.log('🟢 DRAG START');
    console.log('  active.id:', id);

    if (id.startsWith('column-')) {
      const columnId = id.replace('column-', '');
      console.log('  Dragging COLUMN:', columnId);
      const column = columns.find(col => col.id === columnId);
      if (column) {
        setActiveColumn(column);
      }
      return;
    }

    if (id.includes('-task-')) {
      const [columnId, taskId] = id.split('-task-');
      console.log('  Dragging TASK');
      console.log('  columnId:', columnId);
      console.log('  taskId:', taskId);
      const column = columns.find(col => col.id === columnId);
      console.log('  found column:', column?.id);
      if (column) {
        const task = column.tasks.find(t => t.id === taskId);
        console.log('  found task:', task?.id);
        if (task) {
          setActiveTask(task);
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('🟢 DRAG END');

    const { active, over } = event;

    if (!over) {
      console.log('  ❌ No over target');
      setActiveColumn(null);
      setActiveTask(null);
      setMousePosition(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('  activeId:', activeId);
    console.log('  overId:', overId);
    console.log('  mousePosition at drop:', mousePosition);

    if (activeId === overId) {
      console.log('  ⏭️ Same element, skipping');
      setActiveColumn(null);
      setActiveTask(null);
      setMousePosition(null);
      return;
    }

    // Handle column reordering
    if (activeId.startsWith('column-')) {
      console.log('📊 COLUMN REORDER');

      const activeColId = activeId.replace('column-', '');
      console.log('  activeColId:', activeColId);

      let overColId: string | null = null;
      let isColumnDrop = false;

      if (overId.startsWith('column-')) {
        overColId = overId.replace('column-', '');
        isColumnDrop = true;
        console.log('  Dropping on COLUMN (prefixed):', overColId);
      } else if (overId !== 'columns-container') {
        const columnExists = columns.some(col => col.id === overId);
        if (columnExists) {
          overColId = overId;
          isColumnDrop = true;
          console.log('  Dropping on COLUMN (raw):', overColId);
        } else {
          console.log('  ❌ overId is not a column:', overId);
        }
      }

      if (isColumnDrop && overColId) {
        const oldIndex = columns.findIndex(col => col.id === activeColId);
        const newIndex = columns.findIndex(col => col.id === overColId);

        console.log('  oldIndex:', oldIndex);
        console.log('  newIndex:', newIndex);

        const overElement = document.querySelector(`[data-column-id="${overColId}"]`);
        let insertIndex = newIndex;

        if (overElement) {
          const rect = overElement.getBoundingClientRect();
          let mouseX = rect.left + rect.width / 2;
          if (mousePosition) {
            mouseX = mousePosition.x;
          }
          const isLeftHalf = mouseX < rect.left + rect.width / 2;

          console.log('  isLeftHalf:', isLeftHalf);

          if (oldIndex < newIndex) {
            if (isLeftHalf) {
              insertIndex = Math.max(0, newIndex - 1);
            } else {
              insertIndex = newIndex;
            }
          } else if (oldIndex > newIndex) {
            if (isLeftHalf) {
              insertIndex = newIndex;
            } else {
              insertIndex = Math.min(columns.length - 1, newIndex + 1);
            }
          } else {
            insertIndex = newIndex;
          }

          insertIndex = Math.max(0, Math.min(columns.length - 1, insertIndex));
          console.log('  Final insertIndex:', insertIndex);
        }

        if (insertIndex === oldIndex) {
          if (oldIndex < newIndex) {
            insertIndex = Math.min(columns.length - 1, oldIndex + 1);
          } else if (oldIndex > newIndex) {
            insertIndex = Math.max(0, oldIndex - 1);
          }
        }

        if (oldIndex !== insertIndex) {
          console.log('  ✅ Moving column from', oldIndex, 'to', insertIndex);
          const newColumns = arrayMove(columns, oldIndex, insertIndex);
          setColumns(newColumns);

          // 🔥 PERSISTENCE: Call Server Action
          console.log('🔵 CALLING reorderColumnsAction');
          console.log('  boardId:', boardId);
          console.log('  columnId:', activeColId);
          console.log('  newOrder:', insertIndex);

          reorderColumnsAction({
            boardId: boardId,
            columnId: activeColId,
            newOrder: insertIndex,
          }).then((result) => {
            console.log('  reorderColumnsAction result:', result);
            if (!result.success) {
              console.log('  ❌ Failed to persist, rolling back...');
              setColumns(columns);
            } else {
              console.log('  ✅ Persisted successfully');
            }
          }).catch((error) => {
            console.error('  ❌ reorderColumnsAction error:', error);
            setColumns(columns);
          });
        } else {
          console.log('  ⏭️ No position change needed');
        }

        setActiveColumn(null);
        setActiveTask(null);
        setMousePosition(null);
        return;
      }

      if (overId === 'columns-container') {
        console.log('  Dropping on CONTAINER (end of list)');
        const oldIndex = columns.findIndex(col => col.id === activeColId);

        if (oldIndex !== -1 && oldIndex !== columns.length - 1) {
          console.log('  ✅ Moving column to end');
          const newColumns = [...columns];
          const [movedColumn] = newColumns.splice(oldIndex, 1);
          newColumns.push(movedColumn);
          setColumns(newColumns);

          // 🔥 PERSISTENCE: Call Server Action
          const insertIndex = columns.length - 1;
          console.log('🔵 CALLING reorderColumnsAction (end)');
          console.log('  boardId:', boardId);
          console.log('  columnId:', activeColId);
          console.log('  newOrder:', insertIndex);

          reorderColumnsAction({
            boardId: boardId,
            columnId: activeColId,
            newOrder: insertIndex,
          }).then((result) => {
            console.log('  reorderColumnsAction result:', result);
            if (!result.success) {
              console.log('  ❌ Failed to persist, rolling back...');
              setColumns(columns);
            } else {
              console.log('  ✅ Persisted successfully');
            }
          }).catch((error) => {
            console.error('  ❌ reorderColumnsAction error:', error);
            setColumns(columns);
          });
        }

        setActiveColumn(null);
        setActiveTask(null);
        setMousePosition(null);
        return;
      }

      console.log('  ⚠️ Unhandled overId:', overId);
      setActiveColumn(null);
      setActiveTask(null);
      setMousePosition(null);
      return;
    }

    // Handle task dragging (persistence to be added similarly)
    // ... (task drag logic remains unchanged)
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div ref={setContainerRef} className={className}>
        <SortableContext
          items={columns.map(col => `column-${col.id}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {columns.map((column) => (
              <SortableColumn key={column.id} column={column} />
            ))}
          </div>
        </SortableContext>
        <div
          className={`h-16 w-full mt-2 rounded-lg border-2 border-dashed transition-colors ${isContainerOver ? 'border-primary bg-primary/10' : 'border-transparent'
            }`}
        />
      </div>
      <DragOverlay>
        {activeColumn && (
          <div className="w-[280px] opacity-90">
            <div className="rounded-lg border bg-card p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{activeColumn.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {activeColumn.tasks.length} tasks
                </span>
              </div>
            </div>
          </div>
        )}
        {activeTask && (
          <div className="w-[280px] opacity-90">
            <div className="rounded-md border bg-card p-3 shadow-lg">
              <p className="font-medium text-sm">{activeTask.title}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {activeTask.priority.value}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {activeTask.type}
                </span>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}