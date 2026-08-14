'use client';

import { useRef, useEffect, useCallback } from 'react';
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
import { reorderTasksAction, moveTaskAction } from '@/app/actions/task';
import { useBoardStore } from '@/stores/boardStore';
import { useBoardLogic } from '@/hooks/useBoardLogic';

interface BoardViewProps {
  board: {
    id: string;
    title: string;
    columns: ColumnData[];
  };
  className?: string;
}

export function BoardView({ board: initialBoard, className }: BoardViewProps) {
  const boardId = initialBoard.id;

  // Zustand store state
  const columns = useBoardStore((state) => state.columns);
  const activeColumn = useBoardStore((state) => state.activeColumn);
  const activeTask = useBoardStore((state) => state.activeTask);
  const mousePosition = useBoardStore((state) => state.mousePosition);

  // Zustand store setters
  const setColumns = useBoardStore((state) => state.setColumns);
  const setActiveColumn = useBoardStore((state) => state.setActiveColumn);
  const setActiveTask = useBoardStore((state) => state.setActiveTask);
    const setMousePosition = useBoardStore((state) => state.setMousePosition);
  const setBoardId = useBoardStore((state) => state.setBoardId);

  // Safe initialization: only initialize on boardId change or first mount
  // Avoid overwriting optimistic state on ordinary re-renders
  useEffect(() => {
    const currentBoardId = useBoardStore.getState().boardId;
    const currentColumns = useBoardStore.getState().columns;

    if (currentBoardId !== boardId) {
      // Board changed — safe to reset all state
      setColumns(initialBoard.columns);
      setBoardId(boardId);
      setActiveColumn(null);
      setActiveTask(null);
      setMousePosition(null);
    } else if (currentColumns.length === 0) {
      // First mount — initialize from server data
      setColumns(initialBoard.columns);
      setBoardId(boardId);
    }
    // If boardId matches AND columns exist → keep optimistic state, do NOT overwrite
  }, [boardId, initialBoard.columns, setColumns, setBoardId, setActiveColumn, setActiveTask, setMousePosition]);

  // Migrate handleTaskCreated from BoardView to useBoardLogic hook
  const { handleTaskCreated } = useBoardLogic(boardId, initialBoard.columns);

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

    // ========== HANDLE TASK CREATED CALLBACK ==========
  // Migrated to useBoardLogic - Step 4

  // ========== HANDLE TASK UPDATED CALLBACK ==========
  const handleTaskUpdated = useCallback((updatedTask: TaskData) => {
    console.log('[BoardView] Task updated, updating state:', updatedTask);

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        // Check if this column contains the task
        const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);
        if (taskIndex === -1) {
          return column;
        }

        // Replace the task with updated version
        const updatedTasks = [...column.tasks];
        updatedTasks[taskIndex] = updatedTask;
        return {
          ...column,
          tasks: updatedTasks,
        };
      });
    });
  }, []);

  // ========== HANDLE COLUMN UPDATED CALLBACK ==========
  const handleColumnUpdated = useCallback((updatedColumn: ColumnData) => {
    console.log('[BoardView] Column updated, updating state:', updatedColumn);

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === updatedColumn.id) {
          return {
            ...column,
            title: updatedColumn.title,
          };
        }
        return column;
      });
    });
  }, []);

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

    // Handle task dragging
    if (activeId.includes('-task-')) {
      console.log('  📝 TASK DRAG');
      const [activeColumnId, activeTaskId] = activeId.split('-task-');
      console.log('  activeColumnId:', activeColumnId);
      console.log('  activeTaskId:', activeTaskId);

      // Find source column
      const sourceColumnIndex = columns.findIndex(col => col.id === activeColumnId);
      console.log('  sourceColumnIndex:', sourceColumnIndex);
      if (sourceColumnIndex === -1) {
        console.log('  ❌ Source column not found');
        setActiveColumn(null);
        setActiveTask(null);
        setMousePosition(null);
        return;
      }
      const sourceColumn = columns[sourceColumnIndex];
      console.log('  sourceColumn:', sourceColumn.id, sourceColumn.title);

      // Find task in source column
      const sourceTaskIndex = sourceColumn.tasks.findIndex(t => t.id === activeTaskId);
      console.log('  sourceTaskIndex:', sourceTaskIndex);
      if (sourceTaskIndex === -1) {
        console.log('  ❌ Task not found in source column');
        setActiveColumn(null);
        setActiveTask(null);
        setMousePosition(null);
        return;
      }

      // Save current state for rollback
      const previousColumns = [...columns];

      // Check if dropping on a task
      if (overId.includes('-task-')) {
        const [destColumnId, destTaskId] = overId.split('-task-');
        console.log('  destColumnId:', destColumnId);
        console.log('  destTaskId:', destTaskId);

        // Same column reorder
        if (activeColumnId === destColumnId) {
          console.log('  🔄 SAME COLUMN REORDER');
          const destTaskIndex = sourceColumn.tasks.findIndex(t => t.id === destTaskId);
          console.log('  destTaskIndex:', destTaskIndex);

          if (destTaskIndex === -1) {
            console.log('  ❌ Destination task not found');
            setActiveColumn(null);
            setActiveTask(null);
            setMousePosition(null);
            return;
          }

          if (sourceTaskIndex === destTaskIndex) {
            console.log('  ⏭️ Same position, skipping');
            setActiveColumn(null);
            setActiveTask(null);
            setMousePosition(null);
            return;
          }

          console.log('  📊 arrayMove from', sourceTaskIndex, 'to', destTaskIndex);
          console.log('  tasks before:', sourceColumn.tasks.map(t => t.id));

          const newTasks = arrayMove(sourceColumn.tasks, sourceTaskIndex, destTaskIndex);
          console.log('  tasks after:', newTasks.map(t => t.id));

          const newColumns = [...columns];
          newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: newTasks };

          console.log('  newColumns updated');
          setColumns(newColumns);

          const orderedTaskIds = newTasks.map(t => t.id);
          console.log('🔵 CALLING reorderTasksAction');
          console.log('  columnId:', activeColumnId);
          console.log('  orderedTaskIds:', orderedTaskIds);

          reorderTasksAction({
            columnId: activeColumnId,
            orderedTaskIds: orderedTaskIds,
          }).then((result) => {
            console.log('  reorderTasksAction result:', result);
            if (!result.success) {
              console.log('  ❌ Failed to persist, rolling back...');
              setColumns(previousColumns);
            } else {
              console.log('  ✅ Persisted successfully');
            }
          }).catch((error) => {
            console.error('  ❌ reorderTasksAction error:', error);
            setColumns(previousColumns);
          });

          setActiveColumn(null);
          setActiveTask(null);
          setMousePosition(null);
          return;
        }

        // Cross-column move
        console.log('  🔄 CROSS COLUMN MOVE');
        const destColumnIndex = columns.findIndex(col => col.id === destColumnId);
        console.log('  destColumnIndex:', destColumnIndex);
        if (destColumnIndex === -1) {
          console.log('  ❌ Destination column not found');
          setActiveColumn(null);
          setActiveTask(null);
          setMousePosition(null);
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
        setColumns(newColumns);

        console.log('🔵 CALLING moveTaskAction');
        console.log('  taskId:', activeTaskId);
        console.log('  sourceColumnId:', activeColumnId);
        console.log('  targetColumnId:', destColumnId);
        console.log('  targetOrder:', destTaskIndex);
        console.log('  sourceTaskIds:', sourceTasks.map(t => t.id));
        console.log('  targetTaskIds:', destTasks.map(t => t.id));

        moveTaskAction({
          taskId: activeTaskId,
          sourceColumnId: activeColumnId,
          targetColumnId: destColumnId,
          targetOrder: destTaskIndex,
          sourceTaskIds: sourceTasks.map(t => t.id),
          targetTaskIds: destTasks.map(t => t.id),
        }).then((result) => {
          console.log('  moveTaskAction result:', result);
          if (!result.success) {
            console.log('  ❌ Failed to persist, rolling back...');
            setColumns(previousColumns);
          } else {
            console.log('  ✅ Persisted successfully');
          }
        }).catch((error) => {
          console.error('  ❌ moveTaskAction error:', error);
          setColumns(previousColumns);
        });

        setActiveColumn(null);
        setActiveTask(null);
        setMousePosition(null);
        return;
      }

      // Dropping on a column (not a task)
      if (!overId.includes('-task-') && overId !== 'columns-container') {
        console.log('  📥 DROPPING ON COLUMN (not task)');
        const destColumnId = overId;
        const destColumnIndex = columns.findIndex(col => col.id === destColumnId);
        console.log('  destColumnIndex:', destColumnIndex);
        if (destColumnIndex === -1) {
          console.log('  ❌ Destination column not found');
          setActiveColumn(null);
          setActiveTask(null);
          setMousePosition(null);
          return;
        }

        if (destColumnIndex === sourceColumnIndex) {
          console.log('  ⏭️ Dropping on same column (empty space), skipping');
          setActiveColumn(null);
          setActiveTask(null);
          setMousePosition(null);
          return;
        }

        const destColumn = columns[destColumnIndex];

        const sourceTasks = [...sourceColumn.tasks];
        console.log('[DnD] sourceTasks BEFORE splice:', sourceTasks.map(t => t.id));
        const [movedTask] = sourceTasks.splice(sourceTaskIndex, 1);
        console.log('[DnD] movedTask:', movedTask.id);
        console.log('[DnD] sourceTasks AFTER splice:', sourceTasks.map(t => t.id));
        console.log('[DnD] sourceTaskIds (to send):', sourceTasks.map(t => t.id));

        const destTasks = [...destColumn.tasks];
        console.log('[DnD] destTasks BEFORE push:', destTasks.map(t => t.id));
        destTasks.push(movedTask);
        console.log('[DnD] destTasks AFTER push:', destTasks.map(t => t.id));
        console.log('[DnD] targetTaskIds (to send):', destTasks.map(t => t.id));

        const newColumns = [...columns];
        newColumns[sourceColumnIndex] = { ...sourceColumn, tasks: sourceTasks };
        newColumns[destColumnIndex] = { ...destColumn, tasks: destTasks };

        console.log('[DnD] newColumns updated');
        setColumns(newColumns);

        console.log('🔵 CALLING moveTaskAction (drop on column)');
        console.log('  taskId:', activeTaskId);
        console.log('  sourceColumnId:', activeColumnId);
        console.log('  targetColumnId:', destColumnId);
        console.log('  targetOrder:', destTasks.length - 1);
        console.log('  sourceTaskIds:', sourceTasks.map(t => t.id));
        console.log('  targetTaskIds:', destTasks.map(t => t.id));

        moveTaskAction({
          taskId: activeTaskId,
          sourceColumnId: activeColumnId,
          targetColumnId: destColumnId,
          targetOrder: destTasks.length - 1,
          sourceTaskIds: sourceTasks.map(t => t.id),
          targetTaskIds: destTasks.map(t => t.id),
        }).then((result) => {
          console.log('  moveTaskAction result:', result);
          if (!result.success) {
            console.log('  ❌ Failed to persist, rolling back...');
            setColumns(previousColumns);
          } else {
            console.log('  ✅ Persisted successfully');
          }
        }).catch((error) => {
          console.error('  ❌ moveTaskAction error:', error);
          setColumns(previousColumns);
        });

        setActiveColumn(null);
        setActiveTask(null);
        setMousePosition(null);
        return;
      }

      // Dropping task into the container (at the end of the last column)
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
        setColumns(newColumns);

        console.log('🔵 CALLING moveTaskAction (drop into container)');
        console.log('  taskId:', activeTaskId);
        console.log('  sourceColumnId:', activeColumnId);
        console.log('  targetColumnId:', lastColumn.id);
        console.log('  targetOrder:', lastTasks.length - 1);
        console.log('  sourceTaskIds:', sourceTasks.map(t => t.id));
        console.log('  targetTaskIds:', lastTasks.map(t => t.id));

        moveTaskAction({
          taskId: activeTaskId,
          sourceColumnId: activeColumnId,
          targetColumnId: lastColumn.id,
          targetOrder: lastTasks.length - 1,
          sourceTaskIds: sourceTasks.map(t => t.id),
          targetTaskIds: lastTasks.map(t => t.id),
        }).then((result) => {
          console.log('  moveTaskAction result:', result);
          if (!result.success) {
            console.log('  ❌ Failed to persist, rolling back...');
            setColumns(previousColumns);
          } else {
            console.log('  ✅ Persisted successfully');
          }
        }).catch((error) => {
          console.error('  ❌ moveTaskAction error:', error);
          setColumns(previousColumns);
        });
      }
    }

    setActiveColumn(null);
    setActiveTask(null);
    setMousePosition(null);
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
              <SortableColumn
                key={column.id}
                column={column}
                boardId={boardId}
                onTaskCreated={handleTaskCreated}
                onTaskUpdated={handleTaskUpdated}
                onColumnUpdated={handleColumnUpdated}
              />
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