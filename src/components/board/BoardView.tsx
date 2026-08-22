'use client';

import { useEffect, useCallback, useRef } from 'react';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';

import { SortableColumn } from './SortableColumn';

import { ColumnData, TaskData } from '@/types/kanban';

import { reorderColumnsAction } from '@/app/actions/board';
import {
  reorderTasksAction,
  moveTaskAction,
} from '@/app/actions/task';

import { useBoardStore } from '@/stores/boardStore';
import { useBoardLogic } from '@/hooks/useBoardLogic';

import { cn } from '@/lib/utils';

interface BoardViewProps {
  board: {
    id: string;
    title: string;
    columns: ColumnData[];
  };
  className?: string;
  onColumnCreated?: (column: ColumnData) => void;
}

interface TaskDragSession {
  taskId: string;
  sourceColumnId: string;
  sourceIndex: number;
}

export function BoardView({
  board: initialBoard,
  className,
  onColumnCreated,
}: BoardViewProps) {
  const boardId = initialBoard.id;

  const columns = useBoardStore((state) => state.columns);

  const setColumns = useBoardStore(
    (state) => state.setColumns
  );

  const setBoardId = useBoardStore(
    (state) => state.setBoardId
  );

  /**
   * --------------------------------------------------------------------------
   * Board initialization
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    const currentBoardId =
      useBoardStore.getState().boardId;

    if (currentBoardId !== boardId) {
      setColumns(initialBoard.columns);
      setBoardId(boardId);
    }

    // We intentionally initialize only when boardId changes.
    // Re-initializing from server props during a drag can fight
    // dnd-kit's optimistic DOM state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const { handleTaskCreated } = useBoardLogic(
    boardId,
    initialBoard.columns
  );

  /**
   * --------------------------------------------------------------------------
   * Task / column callbacks
   * --------------------------------------------------------------------------
   */

  const handleTaskUpdated = useCallback(
    (updatedTask: TaskData) => {
      setColumns((prevColumns) =>
        prevColumns.map((column) => {
          const taskIndex = column.tasks.findIndex(
            (task) => task.id === updatedTask.id
          );

          if (taskIndex === -1) {
            return column;
          }

          const updatedTasks = [...column.tasks];

          updatedTasks[taskIndex] = updatedTask;

          return {
            ...column,
            tasks: updatedTasks,
          };
        })
      );
    },
    [setColumns]
  );

  const handleTaskDeleted = useCallback(
    (taskId: string) => {
      setColumns((prevColumns) =>
        prevColumns.map((column) => ({
          ...column,
          tasks: column.tasks.filter(
            (task) => task.id !== taskId
          ),
        }))
      );
    },
    [setColumns]
  );

  const handleColumnUpdated = useCallback(
    (updatedColumn: ColumnData) => {
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === updatedColumn.id
            ? {
                ...column,
                title: updatedColumn.title,
              }
            : column
        )
      );
    },
    [setColumns]
  );

  const handleColumnDeleted = useCallback(
    (columnId: string) => {
      setColumns((prevColumns) =>
        prevColumns.filter(
          (column) => column.id !== columnId
        )
      );
    },
    [setColumns]
  );

  /**
   * --------------------------------------------------------------------------
   * Helpers
   * --------------------------------------------------------------------------
   */

  const findTaskById = useCallback(
    (id: string) => {
      for (const column of columns) {
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
   *
   * Used for:
   * - drag cancellation
   * - server persistence failure
   */
  const previousColumnsRef =
    useRef<ColumnData[] | null>(null);

  /**
   * Information about the task at the moment drag started.
   *
   * IMPORTANT:
   *
   * We intentionally do NOT use dnd-kit's `initialGroup`
   * later as our source of truth.
   *
   * dnd-kit can change `group` during optimistic sorting.
   * We need an immutable record of where OUR application
   * originally had the task.
   */
  const taskDragSessionRef =
    useRef<TaskDragSession | null>(null);

  /**
   * --------------------------------------------------------------------------
   * DRAG START
   * --------------------------------------------------------------------------
   */

  const handleDragStart = (event: any) => {
    const { source } = event.operation;

    if (!isSortable(source)) {
      return;
    }

    /**
     * --------------------------------------------------------------
     * Column drag
     * --------------------------------------------------------------
     *
     * Column reorder doesn't need a special snapshot beyond the
     * general board snapshot.
     */
    if (source.type === 'column') {
      previousColumnsRef.current =
        structuredClone(
          useBoardStore.getState().columns
        );

      taskDragSessionRef.current = null;

      return;
    }

    /**
     * --------------------------------------------------------------
     * Task drag
     * --------------------------------------------------------------
     */

    if (source.type !== 'task') {
      return;
    }

    const taskId = String(source.id);

    const currentColumns =
      useBoardStore.getState().columns;

    /**
     * Find the task in OUR state.
     *
     * This is more important than reading source.group.
     */
    const sourceColumn =
      currentColumns.find((column) =>
        column.tasks.some(
          (task) => task.id === taskId
        )
      );

    if (!sourceColumn) {
      console.error(
        '[DND] ❌ Could not find dragged task in Zustand',
        {
          taskId,
          columns: currentColumns.map(
            (column) => ({
              id: column.id,
              taskIds: column.tasks.map(
                (task) => task.id
              ),
            })
          ),
        }
      );

      return;
    }

    const sourceIndex =
      sourceColumn.tasks.findIndex(
        (task) => task.id === taskId
      );

    if (sourceIndex === -1) {
      console.error(
        '[DND] ❌ Could not determine source index',
        {
          taskId,
          sourceColumnId: sourceColumn.id,
        }
      );

      return;
    }

    /**
     * Save rollback snapshot.
     */
    previousColumnsRef.current =
      structuredClone(currentColumns);

    /**
     * Save immutable original location.
     */
    taskDragSessionRef.current = {
      taskId,
      sourceColumnId: sourceColumn.id,
      sourceIndex,
    };

    console.log(
      '========== DRAG START =========='
    );

    console.log('[DND] taskId:', taskId);

    console.log(
      '[DND] sourceColumnId:',
      sourceColumn.id
    );

    console.log(
      '[DND] sourceIndex:',
      sourceIndex
    );

    console.log(
      '================================'
    );
  };

  /**
   * --------------------------------------------------------------------------
   * DRAG OVER
   * --------------------------------------------------------------------------
   *
   * This is responsible ONLY for live visual/application state.
   *
   * The server is NOT called here.
   *
   * dnd-kit handles optimistic sorting inside the active sortable list.
   *
   * Zustand is updated when a task crosses from one column to another.
   */
  const handleDragOver = (event: any) => {
    const { source, target } = event.operation;

    if (!isSortable(source)) {
      return;
    }

    if (source.type !== 'task') {
      return;
    }

    if (!target) {
      return;
    }

    const taskId = String(source.id);

    /**
     * Determine destination from dnd-kit's current target.
     */
    let destinationColumnId: string | null =
      null;

    let destinationIndex: number | null =
      null;

    /**
     * Dropped/hovering over another task.
     */
    if (
      isSortable(target) &&
      target.type === 'task'
    ) {
      destinationColumnId =
        target.group != null
          ? String(target.group)
          : null;

      destinationIndex =
        typeof target.index === 'number'
          ? target.index
          : null;
    }

    /**
     * Hovering over an empty column/container.
     */
    else if (target.type === 'column') {
      destinationColumnId = String(target.id);

      /**
       * null means append to the end.
       */
      destinationIndex = null;
    }

    if (!destinationColumnId) {
      return;
    }

    /**
     * IMPORTANT:
     *
     * Find where the task currently lives in OUR state.
     *
     * Do NOT use source.group here.
     *
     * After dnd-kit's optimistic sorting, source.group can represent
     * the new group even though our persistence hasn't happened yet.
     */
    const currentColumns =
      useBoardStore.getState().columns;

    const currentSourceColumnIndex =
      currentColumns.findIndex((column) =>
        column.tasks.some(
          (task) => task.id === taskId
        )
      );

    if (currentSourceColumnIndex === -1) {
      return;
    }

    const currentSourceColumn =
      currentColumns[currentSourceColumnIndex];

    /**
     * Already inside the destination column.
     *
     * dnd-kit's optimistic sorting handles the visual ordering.
     *
     * We only need to mutate Zustand when the task actually
     * crosses a column boundary.
     */
    if (
      currentSourceColumn.id ===
      destinationColumnId
    ) {
      return;
    }

    const destinationColumnIndex =
      currentColumns.findIndex(
        (column) =>
          column.id === destinationColumnId
      );

    if (destinationColumnIndex === -1) {
      return;
    }

    const taskIndex =
      currentSourceColumn.tasks.findIndex(
        (task) => task.id === taskId
      );

    if (taskIndex === -1) {
      return;
    }

    /**
     * Clone only the arrays we are going to modify.
     */
    const nextColumns = currentColumns.map(
      (column) => ({
        ...column,
        tasks: [...column.tasks],
      })
    );

    const sourceColumn =
      nextColumns[currentSourceColumnIndex];

    const destinationColumn =
      nextColumns[destinationColumnIndex];

    const [movedTask] =
      sourceColumn.tasks.splice(
        taskIndex,
        1
      );

    if (!movedTask) {
      return;
    }

    /**
     * Empty destination:
     *
     * append at the end.
     *
     * Non-empty destination:
     *
     * insert at dnd-kit's requested index.
     */
    const insertIndex =
      destinationIndex == null
        ? destinationColumn.tasks.length
        : Math.max(
            0,
            Math.min(
              destinationIndex,
              destinationColumn.tasks.length
            )
          );

    destinationColumn.tasks.splice(
      insertIndex,
      0,
      movedTask
    );

    setColumns(nextColumns);
  };

  /**
   * --------------------------------------------------------------------------
   * DRAG END
   * --------------------------------------------------------------------------
   */

  const handleDragEnd = async (event: any) => {
    const { source } = event.operation;

    /**
     * --------------------------------------------------------------
     * Cancelled drag
     * --------------------------------------------------------------
     */

    if (event.canceled) {
      if (previousColumnsRef.current) {
        setColumns(
          previousColumnsRef.current
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

    /**
     * --------------------------------------------------------------
     * COLUMN REORDER
     * --------------------------------------------------------------
     */

    if (source.type === 'column') {
      const initialIndex =
        source.initialIndex;

      const finalIndex =
        source.index;

      if (
        initialIndex == null ||
        finalIndex == null ||
        initialIndex === finalIndex
      ) {
        previousColumnsRef.current = null;

        return;
      }

      const currentColumns =
        useBoardStore.getState().columns;

      const previousColumns =
        previousColumnsRef.current ??
        structuredClone(currentColumns);

      const movedColumnId =
        currentColumns[initialIndex]?.id;

      if (!movedColumnId) {
        previousColumnsRef.current = null;

        return;
      }

      const nextColumns = [
        ...currentColumns,
      ];

      const [movedColumn] =
        nextColumns.splice(
          initialIndex,
          1
        );

      if (!movedColumn) {
        previousColumnsRef.current = null;

        return;
      }

      nextColumns.splice(
        finalIndex,
        0,
        movedColumn
      );

      setColumns(nextColumns);

      try {
        const result =
          await reorderColumnsAction({
            boardId,
            columnId: movedColumnId,
            newOrder: finalIndex,
          });

        if (!result.success) {
          setColumns(previousColumns);

          console.error(
            '[DND] ❌ Column reorder failed',
            result.message
          );
        }
      } catch (error) {
        setColumns(previousColumns);

        console.error(
          '[DND] ❌ Column reorder request failed',
          error
        );
      } finally {
        previousColumnsRef.current = null;
      }

      return;
    }

    /**
     * --------------------------------------------------------------
     * TASK MOVE / REORDER
     * --------------------------------------------------------------
     */

    if (source.type !== 'task') {
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;

      return;
    }

    const dragSession =
      taskDragSessionRef.current;

    if (!dragSession) {
      console.error(
        '[DND] ❌ Missing task drag session'
      );

      previousColumnsRef.current = null;

      return;
    }

    const {
      taskId,
      sourceColumnId,
      sourceIndex,
    } = dragSession;

    /**
     * IMPORTANT:
     *
     * Read the CURRENT Zustand state.
     *
     * Never use the `columns` variable from React closure here.
     */
    const currentColumns =
      useBoardStore.getState().columns;

    const previousColumns =
      previousColumnsRef.current ??
      structuredClone(currentColumns);

    /**
     * Find where the task ended up.
     *
     * This is our application's source of truth.
     */
    const destinationColumn =
      currentColumns.find((column) =>
        column.tasks.some(
          (task) => task.id === taskId
        )
      );

    if (!destinationColumn) {
      console.error(
        '[DND] ❌ Task does not exist in current state',
        {
          taskId,
        }
      );

      setColumns(previousColumns);

      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;

      return;
    }

    /**
     * Original source column.
     */
    const originalSourceColumn =
      currentColumns.find(
        (column) =>
          column.id === sourceColumnId
      );

    if (!originalSourceColumn) {
      console.error(
        '[DND] ❌ Original source column no longer exists',
        {
          taskId,
          sourceColumnId,
        }
      );

      setColumns(previousColumns);

      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;

      return;
    }

    /**
     * Find the task's final position in our state.
     */
    let finalIndex =
      destinationColumn.tasks.findIndex(
        (task) => task.id === taskId
      );

    /**
     * If dnd-kit reports a final index, use it to ensure that
     * the persistence payload reflects the actual drag position.
     *
     * This is particularly important when the task crossed a
     * column boundary and then moved around inside that column.
     */
    if (
      typeof source.index === 'number' &&
      source.index >= 0 &&
      source.index <
        destinationColumn.tasks.length
    ) {
      finalIndex = source.index;
    }

    if (finalIndex < 0) {
      console.error(
        '[DND] ❌ Could not determine final task index',
        {
          taskId,
          destinationColumnId:
            destinationColumn.id,
        }
      );

      setColumns(previousColumns);

      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;

      return;
    }

    /**
     * --------------------------------------------------------------
     * CROSS-COLUMN MOVE
     * --------------------------------------------------------------
     *
     * Notice what determines this:
     *
     *     sourceColumnId
     *
     * compared with:
     *
     *     destinationColumn.id
     *
     * NOT:
     *
     *     source.initialGroup
     *     source.group
     *
     * This is the critical fix.
     */
    const isCrossColumn =
      sourceColumnId !==
      destinationColumn.id;

    console.log(
      '========== DRAG END =========='
    );

    console.log('[DND] taskId:', taskId);

    console.log(
      '[DND] original source:',
      sourceColumnId
    );

    console.log(
      '[DND] final destination:',
      destinationColumn.id
    );

    console.log(
      '[DND] source index:',
      sourceIndex
    );

    console.log(
      '[DND] final index:',
      finalIndex
    );

    console.log(
      '[DND] cross column:',
      isCrossColumn
    );

    console.log(
      '=============================='
    );

    try {
      /**
       * ------------------------------------------------------------
       * CROSS COLUMN
       * ------------------------------------------------------------
       */

      if (isCrossColumn) {
        /**
         * IMPORTANT — this is the fix.
         *
         * onDragOver only inserts the task into the destination
         * column at wherever it FIRST crosses the boundary. Any
         * further repositioning the user does while still hovering
         * inside that same column is handled entirely by dnd-kit's
         * own DOM-only optimistic sorting — which, by design, never
         * touches Zustand. That means `destinationColumn.tasks` here
         * can still reflect that first landing spot, not wherever
         * the user actually dropped it.
         *
         * `finalIndex` above already correctly recovers the true
         * drop position (from dnd-kit's own tracked source.index).
         * We must re-apply that position to our own array BEFORE
         * reading targetTaskIds from it — otherwise we send the
         * server a targetOrder that says "position X" alongside a
         * targetTaskIds list where the task is still sitting at its
         * OLD position, and whichever one the backend treats as
         * authoritative for persistence wins, silently disagreeing
         * with what the user actually saw.
         */
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
            const safeIndex = Math.max(
              0,
              Math.min(finalIndex, destTasks.length)
            );
            destTasks.splice(safeIndex, 0, moved);
            setColumns(nextColumns);
            finalDestTasks = destTasks;
          }
        }

        const sourceTaskIds = originalSourceColumn.tasks
          .filter((task) => task.id !== taskId)
          .map((task) => task.id);

        const targetTaskIds = finalDestTasks.map((task) => task.id);

        /**
         * Make absolutely sure the moved task exists
         * in the destination payload.
         */
        if (!targetTaskIds.includes(taskId)) {
          console.error(
            '[DND] ❌ Destination payload does not contain moved task',
            {
              taskId,
              targetTaskIds,
            }
          );

          setColumns(previousColumns);

          return;
        }

        const result =
          await moveTaskAction({
            taskId,

            sourceColumnId,

            targetColumnId:
              destinationColumn.id,

            targetOrder: finalIndex,

            sourceTaskIds,

            targetTaskIds,
          });

        if (!result.success) {
          console.error(
            '[DND] ❌ Cross-column move failed',
            result.message
          );

          setColumns(previousColumns);

          return;
        }

        console.log(
          '[DND] ✅ Cross-column move persisted'
        );

        return;
      }

      /**
       * ------------------------------------------------------------
       * SAME COLUMN
       * ------------------------------------------------------------
       */

      /**
       * If the task remained in the same column and did not
       * actually change position, there is nothing to persist.
       */
      if (sourceIndex === finalIndex) {
        console.log(
          '[DND] Same position - nothing to persist'
        );

        return;
      }

      /**
       * Build the final ordering from the current state.
       *
       * dnd-kit visually reordered the same sortable list,
       * but our Zustand array still needs the final order.
       */
      const columnIndex =
        currentColumns.findIndex(
          (column) =>
            column.id === destinationColumn.id
        );

      if (columnIndex === -1) {
        setColumns(previousColumns);

        return;
      }

      const nextColumns =
        currentColumns.map(
          (column) => ({
            ...column,
            tasks: [...column.tasks],
          })
        );

      const taskList =
        nextColumns[columnIndex].tasks;

      const actualCurrentIndex =
        taskList.findIndex(
          (task) => task.id === taskId
        );

      if (actualCurrentIndex === -1) {
        setColumns(previousColumns);

        return;
      }

      /**
       * Apply the reorder to Zustand.
       */
      const [movedTask] =
        taskList.splice(
          actualCurrentIndex,
          1
        );

      if (!movedTask) {
        setColumns(previousColumns);

        return;
      }

      const safeFinalIndex =
        Math.max(
          0,
          Math.min(
            finalIndex,
            taskList.length
          )
        );

      taskList.splice(
        safeFinalIndex,
        0,
        movedTask
      );

      setColumns(nextColumns);

      /**
       * Persist final ordering.
       */
      const result =
        await reorderTasksAction({
          columnId:
            destinationColumn.id,

          orderedTaskIds:
            taskList.map(
              (task) => task.id
            ),
        });

      if (!result.success) {
        console.error(
          '[DND] ❌ Task reorder failed',
          result.message
        );

        setColumns(previousColumns);

        return;
      }

      console.log(
        '[DND] ✅ Task reorder persisted'
      );
    } catch (error) {
      console.error(
        '[DND] ❌ Drag persistence failed',
        error
      );

      setColumns(previousColumns);
    } finally {
      previousColumnsRef.current = null;
      taskDragSessionRef.current = null;
    }
  };

  /**
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        id="boardView"
        className={cn(
          className,
          'm-0'
        )}
      >
        <div className="flex gap-4 overflow-x-auto overflow-y-clip scroll-smooth scrollbar-track-transparent scrollbar-thumb-muted-foreground">
          {columns.map(
            (column, index) => (
              <SortableColumn
                key={column.id}
                column={column}
                index={index}
                boardId={boardId}
                onTaskCreated={
                  handleTaskCreated
                }
                onTaskUpdated={
                  handleTaskUpdated
                }
                onTaskDeleted={
                  handleTaskDeleted
                }
                onColumnUpdated={
                  handleColumnUpdated
                }
                onColumnDeleted={
                  handleColumnDeleted
                }
                onColumnCreated={
                  onColumnCreated
                }
              />
            )
          )}
        </div>
      </div>

      <DragOverlay>
        {(source) => {
          if (!source) {
            return null;
          }

          /**
           * ------------------------------------------------------------
           * COLUMN OVERLAY
           * ------------------------------------------------------------
           */

          if (source.type === 'column') {
            const columnId =
              String(source.id).replace(
                'column-',
                ''
              );

            const column =
              columns.find(
                (column) =>
                  column.id === columnId
              );

            if (!column) {
              return null;
            }

            return (
              <div className="w-[280px] opacity-90 cursor-grabbing">
                <div className="rounded-lg border bg-card p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {column.title}
                    </h3>

                    <span className="text-sm text-muted-foreground">
                      {column.tasks.length}{' '}
                      tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          /**
           * ------------------------------------------------------------
           * TASK OVERLAY
           * ------------------------------------------------------------
           */

          if (source.type === 'task') {
            const task =
              findTaskById(
                String(source.id)
              );

            if (!task) {
              return null;
            }

            return (
              <div className="w-[280px] opacity-90 cursor-grabbing">
                <div className="rounded-md border bg-card p-3 shadow-lg">
                  <p className="font-medium text-sm">
                    {task.title}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {
                        task.priority
                          .value
                      }
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