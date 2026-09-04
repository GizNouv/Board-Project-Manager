'use client';

import { useCallback, useRef } from 'react';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';

import { SortableColumn } from './SortableColumn';

import { ColumnData } from '@/types/kanban';

import {
  reorderColumnsAction,
  moveTaskAction,
  reorderTasksAction
} from '@/app/actions';

import { useBoardStore } from '@/stores/boardStore';

import { cn } from '@/lib/utils';
import { AutoScroller } from '@dnd-kit/dom';
import { useAction } from '@/hooks/use-action';

interface BoardViewProps {
  className?: string;
}

interface TaskDragSession {
  taskId: string;
  sourceColumnId: string;
  sourceIndex: number;
}

export function BoardView({
  className,
}: BoardViewProps) {

  // useAction for mutations
  const { execute: reorderColumns } = useAction(reorderColumnsAction);
  const { execute: moveTask } = useAction(moveTaskAction);
  const { execute: reorderTasks } = useAction(reorderTasksAction);

  // State from store
  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
  const boardId = useBoardStore((state) => state.boardId);
  const setColumns = useBoardStore((state) => state.setColumns);

  // ============================================================
  // D&D Logic
  // ============================================================

  const findTaskById = useCallback(
    (id: string) => {
      for (const column of Object.values(columns)) {
        const task = column.tasks.find(
          (task) => task.id === id
        );

        if (task) {
          return task;
        }
      }

      return null;
    },
    [columns]
  );

  /**
   * Snapshot of the board BEFORE the drag.
   */
  const previousColumnsRef = useRef<ColumnData[] | null>(null);

  /**
   * Information about the task at the moment drag started.
   */
  const taskDragSessionRef = useRef<TaskDragSession | null>(null);

  // ============================================================
  // Helper: Convert ColumnData[] to Record
  // ============================================================

  const columnsArrayToRecord = (cols: ColumnData[]): Record<string, ColumnData> => {
    return cols.reduce((acc, col) => {
      acc[col.id] = col;
      return acc;
    }, {} as Record<string, ColumnData>);
  };

  // ============================================================
  // DRAG START
  // ============================================================

  const handleDragStart = (event: any) => {
    const { source } = event.operation;

    if (!isSortable(source)) {
      return;
    }

    if (source.type === 'column') {
      previousColumnsRef.current = structuredClone(
        Object.values(useBoardStore.getState().columns)
      );
      taskDragSessionRef.current = null;
      return;
    }

    if (source.type !== 'task') {
      return;
    }

    const taskId = String(source.id);
    const currentColumns = Object.values(useBoardStore.getState().columns);

    const sourceColumn = currentColumns.find((column) =>
      column.tasks.some((task) => task.id === taskId)
    );

    if (!sourceColumn) {
      console.error('[DND] ❌ Could not find dragged task in Zustand', { taskId });
      return;
    }

    const sourceIndex = sourceColumn.tasks.findIndex(
      (task) => task.id === taskId
    );

    if (sourceIndex === -1) {
      console.error('[DND] ❌ Could not determine source index', {
        taskId,
        sourceColumnId: sourceColumn.id,
      });
      return;
    }

    previousColumnsRef.current = structuredClone(currentColumns);
    taskDragSessionRef.current = {
      taskId,
      sourceColumnId: sourceColumn.id,
      sourceIndex,
    };
  };

  // ============================================================
  // DRAG OVER
  // ============================================================

  const handleDragOver = (event: any) => {
    const { source, target } = event.operation;

    if (!isSortable(source) || source.type !== 'task' || !target) {
      return;
    }

    const taskId = String(source.id);
    let destinationColumnId: string | null = null;
    let destinationIndex: number | null = null;

    if (isSortable(target) && target.type === 'task') {
      destinationColumnId = target.group != null ? String(target.group) : null;
      destinationIndex = typeof target.index === 'number' ? target.index : null;
    } else if (target.type === 'column') {
      destinationColumnId = String(target.id);
      destinationIndex = null;
    }

    if (!destinationColumnId) {
      return;
    }

    const currentColumns = Object.values(useBoardStore.getState().columns);
    const currentSourceColumnIndex = currentColumns.findIndex((column) =>
      column.tasks.some((task) => task.id === taskId)
    );

    if (currentSourceColumnIndex === -1) {
      return;
    }

    const currentSourceColumn = currentColumns[currentSourceColumnIndex];

    if (currentSourceColumn.id === destinationColumnId) {
      return;
    }

    const destinationColumnIndex = currentColumns.findIndex(
      (column) => column.id === destinationColumnId
    );

    if (destinationColumnIndex === -1) {
      return;
    }

    const taskIndex = currentSourceColumn.tasks.findIndex(
      (task) => task.id === taskId
    );

    if (taskIndex === -1) {
      return;
    }

    const nextColumns = currentColumns.map((column) => ({
      ...column,
      tasks: [...column.tasks],
    }));

    const sourceColumn = nextColumns[currentSourceColumnIndex];
    const destinationColumn = nextColumns[destinationColumnIndex];

    const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
    if (!movedTask) {
      return;
    }

    const insertIndex =
      destinationIndex == null
        ? destinationColumn.tasks.length
        : Math.max(0, Math.min(destinationIndex, destinationColumn.tasks.length));

    destinationColumn.tasks.splice(insertIndex, 0, movedTask);

    setColumns(
      columnsArrayToRecord(nextColumns),
      nextColumns.map((col) => col.id)
    );
  };

  // ============================================================
  // DRAG END
  // ============================================================

  const handleDragEnd = async (event: any) => {
    const { source } = event.operation;

    // ---- CANCELLED DRAG ----
    if (event.canceled) {
      if (previousColumnsRef.current) {
        setColumns(
          columnsArrayToRecord(previousColumnsRef.current),
          previousColumnsRef.current.map((col) => col.id)
        );
      }

      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
      return;
    }

    if (!isSortable(source)) {
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
      return;
    }

    // ---- COLUMN REORDER ----
    if (source.type === 'column') {
      const initialIndex = source.initialIndex;
      const finalIndex = source.index;

      if (
        initialIndex == null ||
        finalIndex == null ||
        initialIndex === finalIndex
      ) {
        previousColumnsRef.current = null;
        return;
      }

      const currentColumns = Object.values(useBoardStore.getState().columns);
      const previousColumns =
        previousColumnsRef.current ?? structuredClone(currentColumns);

      const movedColumnId = currentColumns[initialIndex]?.id;
      if (!movedColumnId) {
        previousColumnsRef.current = null;
        return;
      }

      const nextColumns = [...currentColumns];
      const [movedColumn] = nextColumns.splice(initialIndex, 1);
      if (!movedColumn) {
        previousColumnsRef.current = null;
        return;
      }

      nextColumns.splice(finalIndex, 0, movedColumn);

      setColumns(
        columnsArrayToRecord(nextColumns),
        nextColumns.map((col) => col.id)
      );

            await reorderColumns(
        {
          boardId,
          columnId: movedColumnId,
          newOrder: finalIndex,
        },
        {
          successMessage: "Column reordered",
          onSuccess: () => {
            previousColumnsRef.current = null;
          },
          onError: (message) => {
            setColumns(
              columnsArrayToRecord(previousColumns),
              previousColumns.map((col) => col.id)
            );
            console.error('[DND] ❌ Column reorder failed', message);
            previousColumnsRef.current = null;
          },
        }
      );

      return;
    }

    // ---- TASK MOVE / REORDER ----
    if (source.type !== 'task') {
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
      return;
    }

    const dragSession = taskDragSessionRef.current;

    if (!dragSession) {
      console.error('[DND] ❌ Missing task drag session');
      previousColumnsRef.current = null;
      return;
    }

    const { taskId, sourceColumnId, sourceIndex } = dragSession;

    const currentColumns = Object.values(useBoardStore.getState().columns);
    const previousColumns =
      previousColumnsRef.current ?? structuredClone(currentColumns);

    // Find destination column
    const destinationColumn = currentColumns.find((column) =>
      column.tasks.some((task) => task.id === taskId)
    );

    if (!destinationColumn) {
      console.error('[DND] ❌ Task does not exist in current state', { taskId });
      setColumns(
        columnsArrayToRecord(previousColumns),
        previousColumns.map((col) => col.id)
      );
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
      return;
    }

    const originalSourceColumn = currentColumns.find(
      (column) => column.id === sourceColumnId
    );

    if (!originalSourceColumn) {
      console.error('[DND] ❌ Original source column no longer exists', {
        taskId,
        sourceColumnId,
      });
      setColumns(
        columnsArrayToRecord(previousColumns),
        previousColumns.map((col) => col.id)
      );
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
      return;
    }

    let finalIndex = destinationColumn.tasks.findIndex(
      (task) => task.id === taskId
    );

    if (
      typeof source.index === 'number' &&
      source.index >= 0 &&
      source.index < destinationColumn.tasks.length
    ) {
      finalIndex = source.index;
    }

    if (finalIndex < 0) {
      console.error('[DND] ❌ Could not determine final task index', {
        taskId,
        destinationColumnId: destinationColumn.id,
      });
      setColumns(
        columnsArrayToRecord(previousColumns),
        previousColumns.map((col) => col.id)
      );
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
      return;
    }

    const isCrossColumn = sourceColumnId !== destinationColumn.id;

    try {
      // ---- CROSS-COLUMN MOVE ----
      if (isCrossColumn) {
        const destColumnIndex = currentColumns.findIndex(
          (column) => column.id === destinationColumn.id
        );

        let finalDestTasks = destinationColumn.tasks;

        if (destColumnIndex !== -1) {
          const nextColumns = currentColumns.map((column) => ({
            ...column,
            tasks: [...column.tasks],
          }));

          const destTasks = nextColumns[destColumnIndex].tasks;
          const currentTaskIndexInDest = destTasks.findIndex(
            (task) => task.id === taskId
          );

          if (
            currentTaskIndexInDest !== -1 &&
            currentTaskIndexInDest !== finalIndex
          ) {
            const [moved] = destTasks.splice(currentTaskIndexInDest, 1);
            const safeIndex = Math.max(0, Math.min(finalIndex, destTasks.length));
            destTasks.splice(safeIndex, 0, moved);

            setColumns(
              columnsArrayToRecord(nextColumns),
              nextColumns.map((col) => col.id)
            );
            finalDestTasks = destTasks;
          }
        }

        const sourceTaskIds = originalSourceColumn.tasks
          .filter((task) => task.id !== taskId)
          .map((task) => task.id);

        const targetTaskIds = finalDestTasks.map((task) => task.id);

        if (!targetTaskIds.includes(taskId)) {
          console.error('[DND] ❌ Destination payload does not contain moved task', {
            taskId,
            targetTaskIds,
          });
          setColumns(
            columnsArrayToRecord(previousColumns),
            previousColumns.map((col) => col.id)
          );
          return;
        }

                await moveTask(
          {
            taskId,
            sourceColumnId,
            targetColumnId: destinationColumn.id,
            targetOrder: finalIndex,
            sourceTaskIds,
            targetTaskIds,
          },
          {
            successMessage: "Task moved",
            onSuccess: () => {
              console.log('[DND] ✅ Cross-column move persisted');
              previousColumnsRef.current = null;
              taskDragSessionRef.current = null;
            },
            onError: (message) => {
              console.error('[DND] ❌ Cross-column move failed', message);
              setColumns(
                columnsArrayToRecord(previousColumns),
                previousColumns.map((col) => col.id)
              );
              previousColumnsRef.current = null;
              taskDragSessionRef.current = null;
            },
          }
        );

        return;
      }

      // ---- SAME-COLUMN REORDER ----
      if (sourceIndex === finalIndex) {
        console.log('[DND] Same position - nothing to persist');
        previousColumnsRef.current = null;
        taskDragSessionRef.current = null;
        return;
      }

      const columnIndex = currentColumns.findIndex(
        (column) => column.id === destinationColumn.id
      );

      if (columnIndex === -1) {
        setColumns(
          columnsArrayToRecord(previousColumns),
          previousColumns.map((col) => col.id)
        );
        previousColumnsRef.current = null;
        taskDragSessionRef.current = null;
        return;
      }

      const nextColumns = currentColumns.map((column) => ({
        ...column,
        tasks: [...column.tasks],
      }));

      const taskList = nextColumns[columnIndex].tasks;
      const actualCurrentIndex = taskList.findIndex((task) => task.id === taskId);

      if (actualCurrentIndex === -1) {
        setColumns(
          columnsArrayToRecord(previousColumns),
          previousColumns.map((col) => col.id)
        );
        previousColumnsRef.current = null;
        taskDragSessionRef.current = null;
        return;
      }

      const [movedTask] = taskList.splice(actualCurrentIndex, 1);
      if (!movedTask) {
        setColumns(
          columnsArrayToRecord(previousColumns),
          previousColumns.map((col) => col.id)
        );
        previousColumnsRef.current = null;
        taskDragSessionRef.current = null;
        return;
      }

      const safeFinalIndex = Math.max(0, Math.min(finalIndex, taskList.length));
      taskList.splice(safeFinalIndex, 0, movedTask);

      setColumns(
        columnsArrayToRecord(nextColumns),
        nextColumns.map((col) => col.id)
      );

            await reorderTasks(
        {
          columnId: destinationColumn.id,
          orderedTaskIds: taskList.map((task) => task.id),
        },
        {
          successMessage: "Tasks reordered",
          onSuccess: () => {
            console.log('[DND] ✅ Task reorder persisted');
            previousColumnsRef.current = null;
            taskDragSessionRef.current = null;
          },
          onError: (message) => {
            console.error('[DND] ❌ Task reorder failed', message);
            setColumns(
              columnsArrayToRecord(previousColumns),
              previousColumns.map((col) => col.id)
            );
            previousColumnsRef.current = null;
            taskDragSessionRef.current = null;
          },
        }
      );
    } catch (error) {
      console.error('[DND] ❌ Drag persistence failed', error);
      setColumns(
        columnsArrayToRecord(previousColumns),
        previousColumns.map((col) => col.id)
      );
    } finally {
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  const columnList = columnOrder.map((id) => columns[id]).filter(Boolean);

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      plugins={(defaults) => [
        ...defaults,
        AutoScroller.configure({
          acceleration: 15,
          threshold: { x: 0.3, y: 0.3 },
        }),
      ]}
    >
      <div id="boardView" className={cn(className, 'm-0')}>
        <div className="flex gap-4 overflow-x-auto overflow-y-clip scroll-smooth scrollbar-track-transparent scrollbar-thumb-muted-foreground">
          {columnList.map((column, index) => (
            <SortableColumn
              key={column.id}
              column={column}
              index={index}
              boardId={boardId}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {(source) => {
          if (!source) {
            return null;
          }

          if (source.type === 'column') {
            const columnId = String(source.id).replace('column-', '');
            const column = columns[columnId];

            if (!column) {
              return null;
            }

            return (
              <div className="w-[280px] opacity-90 cursor-grabbing">
                <div className="rounded-lg border bg-card p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{column.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {column.tasks.length} tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          if (source.type === 'task') {
            const task = findTaskById(String(source.id));
            if (!task) {
              return null;
            }

            return (
              <div className="w-[280px] opacity-90 cursor-grabbing">
                <div className="rounded-md border bg-card p-3 shadow-lg">
                  <p className="font-medium text-sm">{task.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {task.priority.value}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {task.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}