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

  // Log initial state
  useEffect(() => {
    console.log('🔵 BoardView mounted with columns:', columns.map(c => ({
      id: c.id,
      title: c.title,
      taskCount: c.tasks.length,
      taskIds: c.tasks.map(t => t.id)
    })));
  }, []);

  // Log every state change
  useEffect(() => {
    console.log('🔄 BoardView state updated. Columns:', columns.map(c => ({
      id: c.id,
      title: c.title,
      taskCount: c.tasks.length,
      taskIds: c.tasks.map(t => t.id)
    })));
  }, [columns]);

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
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('  activeId:', activeId);
    console.log('  overId:', overId);

    // If dropping on the same element, do nothing
    if (activeId === overId) {
      console.log('  ⏭️ Same element, skipping');
      setActiveColumn(null);
      setActiveTask(null);
      return;
    }

    // Handle column reordering
    if (activeId.startsWith('column-')) {
      console.log('📊 COLUMN REORDER');

      const activeColId = activeId.replace('column-', '');
      console.log('  activeColId:', activeColId);

      let overColId: string | null = null;
      let isColumnDrop = false;

      // Check if dropping on a prefixed column ID
      if (overId.startsWith('column-')) {
        overColId = overId.replace('column-', '');
        isColumnDrop = true;
        console.log('  Dropping on COLUMN (prefixed):', overColId);
      }
      // Check if dropping on a raw column ID
      else if (overId !== 'columns-container') {
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
        console.log('  columns.length:', columns.length);
        console.log('  columns order:', columns.map(c => c.id));

        const overElement = document.querySelector(`[data-column-id="${overColId}"]`);
        let insertIndex = newIndex;

        if (overElement) {
          const rect = overElement.getBoundingClientRect();
          let mouseX = rect.left + rect.width / 2;
          if ((event as any).activatorEvent) {
            mouseX = (event as any).activatorEvent.clientX;
          }
          const isLeftHalf = mouseX < rect.left + rect.width / 2;

          console.log('  Mouse X:', mouseX);
          console.log('  Rect left:', rect.left);
          console.log('  Rect right:', rect.right);
          console.log('  isLeftHalf:', isLeftHalf);

          if (oldIndex < newIndex) {
            // Moving right
            if (isLeftHalf) {
              insertIndex = newIndex - 1;
              console.log('  Moving right, left half -> insertIndex:', insertIndex);
            } else {
              insertIndex = newIndex;
              console.log('  Moving right, right half -> insertIndex:', insertIndex);
            }
          } else if (oldIndex > newIndex) {
            // Moving left
            if (isLeftHalf) {
              insertIndex = newIndex;
              console.log('  Moving left, left half -> insertIndex:', insertIndex);
            } else {
              insertIndex = newIndex + 1;
              console.log('  Moving left, right half -> insertIndex:', insertIndex);
            }
          } else {
            insertIndex = newIndex;
          }

          // Ensure insertIndex is within bounds
          insertIndex = Math.max(0, Math.min(columns.length - 1, insertIndex));
          console.log('  Final insertIndex:', insertIndex);
        } else {
          console.log('  ❌ No element found for overColId:', overColId);
        }

        // If insertIndex equals oldIndex, adjust it by 1 in the direction of movement
        if (insertIndex === oldIndex) {
          console.log('  🔧 insertIndex equals oldIndex, adjusting...');
          if (oldIndex < newIndex) {
            // Moving right, but no position change - move one step right
            insertIndex = Math.min(columns.length - 1, oldIndex + 1);
            console.log('  Adjusting right -> insertIndex:', insertIndex);
          } else if (oldIndex > newIndex) {
            // Moving left, but no position change - move one step left
            insertIndex = Math.max(0, oldIndex - 1);
            console.log('  Adjusting left -> insertIndex:', insertIndex);
          }
        }

        if (oldIndex !== insertIndex) {
          console.log('  ✅ Moving column from', oldIndex, 'to', insertIndex);
          const newColumns = arrayMove(columns, oldIndex, insertIndex);
          console.log('  newColumns order after move:', newColumns.map(c => c.id));
          updateCounterRef.current += 1;
          console.log('  🔄 State update #', updateCounterRef.current);
          setColumns(newColumns);
        } else {
          console.log('  ⏭️ No position change needed');
        }

        setActiveColumn(null);
        setActiveTask(null);
        return;
      }

      // Check if dropping on container
      if (overId === 'columns-container') {
        console.log('  Dropping on CONTAINER (end of list)');
        const oldIndex = columns.findIndex(col => col.id === activeColId);
        console.log('  oldIndex:', oldIndex);

        if (oldIndex !== -1 && oldIndex !== columns.length - 1) {
          console.log('  ✅ Moving column to end');
          const newColumns = [...columns];
          const [movedColumn] = newColumns.splice(oldIndex, 1);
          newColumns.push(movedColumn);
          console.log('  newColumns order after move:', newColumns.map(c => c.id));
          updateCounterRef.current += 1;
          console.log('  🔄 State update #', updateCounterRef.current);
          setColumns(newColumns);
        } else {
          console.log('  ⏭️ Column already at end or not found');
        }

        setActiveColumn(null);
        setActiveTask(null);
        return;
      }

      console.log('  ⚠️ Unhandled overId:', overId);
      setActiveColumn(null);
      setActiveTask(null);
      return;
    }

    // Handle task dragging
    if (activeId.includes('-task-')) {
      console.log('  📝 TASK DRAG');
      const [activeColumnId, activeTaskId] = activeId.split('-task-');
      console.log('  activeColumnId:', activeColumnId);
      console.log('  activeTaskId:', activeTaskId);

      const sourceColumnIndex = columns.findIndex(col => col.id === activeColumnId);
      console.log('  sourceColumnIndex:', sourceColumnIndex);
      if (sourceColumnIndex === -1) {
        console.log('  ❌ Source column not found');
        setActiveColumn(null);
        setActiveTask(null);
        return;
      }
      const sourceColumn = columns[sourceColumnIndex];
      console.log('  sourceColumn:', sourceColumn.id, sourceColumn.title);

      const sourceTaskIndex = sourceColumn.tasks.findIndex(t => t.id === activeTaskId);
      console.log('  sourceTaskIndex:', sourceTaskIndex);
      if (sourceTaskIndex === -1) {
        console.log('  ❌ Task not found in source column');
        setActiveColumn(null);
        setActiveTask(null);
        return;
      }

      if (overId.includes('-task-')) {
        const [destColumnId, destTaskId] = overId.split('-task-');
        console.log('  destColumnId:', destColumnId);
        console.log('  destTaskId:', destTaskId);

        if (activeColumnId === destColumnId) {
          console.log('  🔄 SAME COLUMN REORDER');
          const destTaskIndex = sourceColumn.tasks.findIndex(t => t.id === destTaskId);
          console.log('  destTaskIndex:', destTaskIndex);

          if (destTaskIndex === -1) {
            console.log('  ❌ Destination task not found');
            setActiveColumn(null);
            setActiveTask(null);
            return;
          }

          if (sourceTaskIndex === destTaskIndex) {
            console.log('  ⏭️ Same position, skipping');
            setActiveColumn(null);
            setActiveTask(null);
            return;
          }

          console.log('  📊 arrayMove from', sourceTaskIndex, 'to', destTaskIndex);
          console.log('  tasks before:', sourceColumn.tasks.map(t => t.id));

          const newTasks = arrayMove(sourceColumn.tasks, sourceTaskIndex, destTaskIndex);
          console.log('  tasks after:', newTasks.map(t => t.id));

          const newColumns = [...columns];
          newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: newTasks };

          console.log('  newColumns updated');
          updateCounterRef.current += 1;
          console.log('  🔄 State update #', updateCounterRef.current);
          setColumns(newColumns);

          setActiveColumn(null);
          setActiveTask(null);
          return;
        }

        console.log('  🔄 CROSS COLUMN MOVE');
        const destColumnIndex = columns.findIndex(col => col.id === destColumnId);
        console.log('  destColumnIndex:', destColumnIndex);
        if (destColumnIndex === -1) {
          console.log('  ❌ Destination column not found');
          setActiveColumn(null);
          setActiveTask(null);
          return;
        }
        const destColumn = columns[destColumnIndex];

        const destTaskIndex = destColumn.tasks.findIndex(t => t.id === destTaskId);
        console.log('  destTaskIndex:', destTaskIndex);

        const sourceTasks = [...sourceColumn.tasks];
        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);
        console.log('  removed task:', movedTask.id);
        console.log('  sourceTasks after removal:', sourceTasks.map(t => t.id));

        const destTasks = [...destColumn.tasks];
        destTasks.splice(destTaskIndex, 0, movedTask);
        console.log('  destTasks after insertion:', destTasks.map(t => t.id));

        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: sourceTasks };
        newColumns[destColumnIndex] = { ...destColumn, tasks: destTasks };

        console.log('  newColumns updated');
        updateCounterRef.current += 1;
        console.log('  🔄 State update #', updateCounterRef.current);
        setColumns(newColumns);

        setActiveColumn(null);
        setActiveTask(null);
        return;
      }

      if (!overId.includes('-task-') && overId !== 'columns-container') {
        console.log('  📥 DROPPING ON COLUMN (not task)');
        const destColumnId = overId;
        const destColumnIndex = columns.findIndex(col => col.id === destColumnId);
        console.log('  destColumnIndex:', destColumnIndex);
        if (destColumnIndex === -1) {
          console.log('  ❌ Destination column not found');
          setActiveColumn(null);
          setActiveTask(null);
          return;
        }

        if (destColumnIndex === sourceColumnIndex) {
          console.log('  ⏭️ Dropping on same column (empty space), skipping');
          setActiveColumn(null);
          setActiveTask(null);
          return;
        }

        const destColumn = columns[destColumnIndex];

        const sourceTasks = [...sourceColumn.tasks];
        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);
        console.log('  removed task:', movedTask.id);
        const destTasks = [...destColumn.tasks];
        destTasks.push(movedTask);
        console.log('  destTasks after push:', destTasks.map(t => t.id));

        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: sourceTasks };
        newColumns[destColumnIndex] = { ...destColumn, tasks: destTasks };

        console.log('  newColumns updated');
        updateCounterRef.current += 1;
        console.log('  🔄 State update #', updateCounterRef.current);
        setColumns(newColumns);

        setActiveColumn(null);
        setActiveTask(null);
        return;
      }

      if (overId === 'columns-container') {
        console.log('  📥 DROPPING INTO CONTAINER');
        const lastColumnIndex = columns.length - 1;
        const lastColumn = columns[lastColumnIndex];
        console.log('  lastColumn:', lastColumn.id);
        const sourceTasks = [...sourceColumn.tasks];
        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);
        console.log('  removed task:', movedTask.id);
        const lastTasks = [...lastColumn.tasks];
        lastTasks.push(movedTask);
        console.log('  lastTasks after push:', lastTasks.map(t => t.id));

        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: sourceTasks };
        newColumns[lastColumnIndex] = { ...lastColumn, tasks: lastTasks };

        console.log('  newColumns updated');
        updateCounterRef.current += 1;
        console.log('  🔄 State update #', updateCounterRef.current);
        setColumns(newColumns);
      }
    }

    setActiveColumn(null);
    setActiveTask(null);
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